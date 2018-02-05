const {flatten, uniq, intersection} = require('lodash')
const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const frontendApi = require('../services/frontendApi')
const {promiseSerial} = require('../promise')
const {network, tokenTransferCron} = require('app/config')
const {getBlockTime, getCurrentBlockNumber} = require('app/utils')
const {scheduleJob, cancelJob} = require('../scheduleUtils')

const {Op} = Sequelize

const fetchLatestTransactions = async ({id, address}) => {
  const row = await db.tokensTransfersReads.findOne({
    attributes: ['lastReadBlockNumber'],
    where: {tokenId: {[Op.eq]: id}},
  })

  const lastReadBlockNumber = row ? Number(row.lastReadBlockNumber) : 0
  const fromBlock = row ? lastReadBlockNumber === 0 ? lastReadBlockNumber : lastReadBlockNumber + 1 : 0
  const currentBlock = await getCurrentBlockNumber()
  const currentBlockTime = await getBlockTime(currentBlock)

  try {
    const result = await tokenTracker.getLatestTransferTransactions(address.toLowerCase(), fromBlock)
    return {
      ...result,
      fromBlock,
      currentBlock,
      currentBlockTime,
    }
  } catch (e) {
    throw new UnexpectedError('blockchainReadFailed', e)
  }
}

const insertTransactions = async (token, transactions, toBlock, currentBlockTime) =>
  db.sequelize.transaction().then(async (transaction) => {
    try {
      await db.tokensTransfersReads.upsert(
        {
          tokenId: token.id,
          lastReadBlockNumber: toBlock,
        },
        {transaction},
      )
      await Promise.all(transactions.map(async (t) => {
        const {
          amount,
          blockNumber,
          logIndex,
          from,
          to,
          transactionHash,
          event,
        } = t
        return db.tokensTransfers.create(
          {
            blockNumber: Number(blockNumber),
            logIndex,
            transactionHash,
            tokenId: token.id,
            network,
            currentBlockTime,
            fromAddress: from.toLowerCase(),
            toAddress: to.toLowerCase(),
            amount: Number(amount),
            rawData: event,
          },
          {transaction}
        )
      }))

      await transaction.commit()
      logger.info({
        network,
        token: token.name,
        transactions: transactions.length,
      }, 'WRITE_TRANSACTIONS')
    } catch (e) {
      transaction.rollback()
      throw new UnexpectedError('insertTransactionsFailed', e)
    }
  })

const updatePendingBalance = async (wallets, token) => {
  const promises = wallets.map(wallet => () =>
    db.sequelize.transaction({lock: Sequelize.Transaction.LOCK.UPDATE})
      .then(async (transaction) => {
        try {
          const walletId = wallet.id
          const tokenId = token.id
          const tokenBalance = await db.tokensBalances.findOne({
            where: {
              [Op.and]: [
                {walletId: {[Op.eq]: walletId}},
                {tokenId: {[Op.eq]: tokenId}},
              ],
            },
            transaction,
          })

          if (!tokenBalance) {
            await db.tokensBalances.create(
              {
                walletId,
                tokenId,
                pendingUpdateBalance: 1,
                balance: 0,
              },
              {transaction}
            )
          } else {
            await tokenBalance.update(
              {
                pendingUpdateBalance: Number(tokenBalance.pendingUpdateBalance) + 1,
              },
              {
                where: {
                  walletId,
                  tokenId,
                },
              },
              {transaction}
            )
          }

          transaction.commit()
        } catch (e) {
          transaction.rollback()
          throw new UnexpectedError('updatePendingBalanceFailed', e)
        }
      }))

  return promiseSerial(promises).then(() => {
    logger.info({
      network,
      token: token.name,
      wallets: wallets.length,
    }, 'PENDING_UPDATE_BALANCE')
  })
}

const sendTransactionsMessages = async (token, wallets, transactions) => {
  const messagesToSend = wallets.map(({address}) => {
    const transaction = transactions.find(t => t.to === address || t.from === address)
    const {to, amount, currentBlockTime} = transaction
    const event = to === address ? 'withdraw' : 'deposit'
    return () => frontendApi.sendTransactionMessage({
      event,
      address,
      network,
      amount,
      currentBlockTime,
      token: token.name,
      status: 'confirmed',
    })
  })

  return promiseSerial(messagesToSend)
}

const getTransactionsWallets = async (transactions) => {
  const addresses = uniq(flatten(transactions.map(t => ([t.to, t.from]))))
  return db.wallets.findAll({
    attributes: ['id', 'address', 'network'],
    where: {address: {[Op.or]: addresses}},
  })
}

const readWriteTransactions = async () =>
  db.tokens.findAll({where: {network: {[Op.eq]: network}}})
    .then(tokens => promiseSerial(tokens.map(token => async () => {
      const {
        transactions: allTransactions,
        fromBlock,
        toBlock,
        currentBlock,
        currentBlockTime,
      } = await fetchLatestTransactions(token)

      logger.info({
        network,
        token: token.name,
        allTransactions: allTransactions.length,
        fromBlock,
        toBlock,
        currentBlock,
        currentBlockTime: new Date(currentBlockTime).toUTCString(),
      }, 'READ_TRANSACTIONS')

      let transactions = []

      if (allTransactions.length) {
        const wallets = await getTransactionsWallets(allTransactions)
        const addresses = wallets.map(w => w.address.toLowerCase())
        transactions = allTransactions.filter(t => intersection(addresses, [t.to.toLowerCase(), t.from.toLowerCase()]))

        if (transactions.length) {
          await updatePendingBalance(wallets, token)

          // TODO: what if server fails ?
          await sendTransactionsMessages(token, wallets, transactions)
        }
      }

      await insertTransactions(token, transactions, toBlock, currentBlockTime)
    })))

module.exports = {
  start: async () => scheduleJob('tokensTransfers', tokenTransferCron, readWriteTransactions),
  stop: async () => cancelJob('tokensTransfers'),
}
