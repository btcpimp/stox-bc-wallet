const schedule = require('node-schedule')
const {flatten, uniq} = require('lodash')
const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const {promiseSerial} = require('../promise')
const {network, tokenTransferCron} = require('app/config')
const {getBlockTime} = require('app/utils')
const {web3} = require('./blockchain')

const {Op} = Sequelize

const fetchLatestTransactions = async ({id, address}) => {
  const row = await db.tokensTransfersReads.findOne({
    attributes: ['lastReadBlockNumber'],
    where: {tokenId: {[Op.eq]: id}},
  })

  const lastReadBlockNumber = Number(row.lastReadBlockNumber)
  const fromBlock = row ? lastReadBlockNumber === 0 ? lastReadBlockNumber : lastReadBlockNumber + 1 : 0
  const currentBlock = await web3.eth.getBlockNumber()
  const currentBlockTime = await getBlockTime(currentBlock)

  try {
    const result = await tokenTracker.getLatestTransferTransactions(address, fromBlock)
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
    const tokenValues = await db.tokensTransfersReads.findOne({where: {tokenId: {[Op.eq]: token.id}}})
    await tokenValues.updateAttributes({lastReadBlockNumber: toBlock}, {transaction})
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
          fromAddress: from,
          toAddress: to,
          amount: Number(amount),
          rawData: event,
        },
        {transaction}
      )
    }))

    try {
      await transaction.commit()
    } catch (e) {
      transaction.rollback()
      throw new UnexpectedError('savingFailed', e)
    }
  })

const updatePendingBalance = async (wallets, token) => {
  const promises = [wallets[0]].map(wallet =>
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
          throw new UnexpectedError('savingFailed', e)
        }
      }))

  return Promise.all(promises)
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
      }, 'READ')

      let transactions = []

      if (allTransactions.length) {
        const addresses = uniq(flatten(transactions.map(t => ([t.to, t.from]))))
        const wallets = await db.wallets.findAll({
          attributes: ['id', 'address'],
          where: {address: {[Op.or]: addresses}},
        })

        const walletAddresses = wallets.map(w => w.address)
        transactions = allTransactions.filter(t => walletAddresses.includes(t.to) || walletAddresses.includes(t.from))

        if (transactions.length) {
          await updatePendingBalance(wallets, token)

          logger.info({
            network,
            token: token.name,
            wallets: wallets.length,
          }, 'PENDING_BALANCE_UPDATE')
        }
      }

      await insertTransactions(token, transactions, toBlock, currentBlockTime)

      logger.info({
        network,
        token: token.name,
        transactions: transactions.length,
      }, 'WRITE')
    })))

const start = async () => {
  logger.info('reader started')
  let promise = null

  schedule.scheduleJob(tokenTransferCron, async () => {
    if (!promise) {
      logger.info('WORKING')
      promise = readWriteTransactions()
        .then(() => {
          promise = null
        })
        .catch((e) => {
          logger.error(e.original ? e.original : e)
          promise = null
        })
    }
  })
}

module.exports = {
  start,
}
