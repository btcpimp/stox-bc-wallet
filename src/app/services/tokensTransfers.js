const {flatten, uniq} = require('lodash')
const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const backendApi = require('../services/backendApi')
const {promiseSerial} = require('../promise')
const {network, tokenTransferCron} = require('app/config')
const {getBlockTime, getCurrentBlockNumber} = require('app/utils')
const {scheduleJob, cancelJob} = require('../scheduleUtils')

const {Op} = Sequelize

const fetchLastReadBlock = async (tokenId) => {
  const row = await db.tokensTransfersReads.findOne({
    attributes: ['lastReadBlockNumber'],
    where: {tokenId: {[Op.eq]: tokenId}},
  })

  const lastReadBlockNumber = row ? Number(row.lastReadBlockNumber) : 0
  return lastReadBlockNumber
}

const updateLastReadBlock = async (tokenId, lastReadBlockNumber) =>
  db.tokensTransfersReads.upsert({tokenId, lastReadBlockNumber})

const fetchLatestTransactions = async ({id, name, address}) => {
  const lastReadBlockNumber = await fetchLastReadBlock(id)
  const fromBlock = lastReadBlockNumber !== 0 ? lastReadBlockNumber + 1 : 0
  const currentBlock = await getCurrentBlockNumber()
  const currentBlockTime = await getBlockTime(currentBlock)

  try {
    const result = await tokenTracker.getLatestTransferTransactions(address, fromBlock)
    logger.info({
      network,
      token: name,
      transactions: result.transactions.length,
      fromBlock,
      toBlock: result.toBlock,
      currentBlock,
      currentBlockTime: new Date(currentBlockTime).toUTCString(),
    }, 'READ_TRANSACTIONS')
    return {
      ...result,
      fromBlock,
      currentBlock,
      currentBlockTime,
    }
  } catch (e) {
    throw new UnexpectedError('blockchain read failed', e)
  }
}

const insertTransactions = async (token, transactions, currentBlockTime) =>
  db.sequelize.transaction().then(async (transaction) => {
    try {
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

      await transaction.commit()
      logger.info({
        network,
        token: token.name,
        currentBlockTime,
        transactions: transactions.length,
      }, 'WRITE_TRANSACTIONS')
    } catch (e) {
      transaction.rollback()
      if (e.original) {
        logger.error(e, e.original.message)
      } else {
        logger.error(e)
      }
    }
  })

const getBalanceInEther = async (token, wallet) => {
  const lastReadBlock = await fetchLastReadBlock(token.id)
  const {balance} = await tokenTracker.getAccountBalanceInEther(token.address, wallet.address, lastReadBlock)
  return balance
}

const updateBalance = async (token, wallet, balance) => {
  const walletAddress = wallet.address
  const walletId = wallet.id
  const tokenId = token.id

  await db.sequelize.transaction({lock: Sequelize.Transaction.LOCK.UPDATE})
    .then(async (transaction) => {
      try {
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
              balance,
              pendingUpdateBalance: 0,
            },
            {transaction}
          )
        } else {
          await tokenBalance.update({balance, pendingUpdateBalance: 0}, {
            where: {
              walletId,
              tokenId,
            },
          }, {transaction})
        }

        transaction.commit()
        logger.info({
          network,
          token: token.name,
          walletAddress,
          balance,
        }, 'UPDATE_BALANCE')
      } catch (e) {
        transaction.rollback()
        if (e.original) {
          logger.error(e, e.original.message)
        } else {
          logger.error(e)
        }
      }
    })

  return balance
}

const sendWalletMessage = (token, wallet, transactions, balance, currentBlockTime) => {
  const message = {
    network,
    address: wallet.address,
    asset: token.name,
    balance,
    happenedAt: currentBlockTime,
    transactions: transactions.map(({transactionHash, to, amount}) => ({
      transactionHash,
      amount,
      status: 'confirmed',
      type: to.toLowerCase() === wallet.address.toLowerCase() ? 'deposit' : 'withdraw',
    })),
  }

  return backendApi.sendTransactionMessage(message)
    .then(() => logger.info(message, 'SEND_TRANSACTIONS'))
    .catch(e => logger.error(e))
}

const getWalletsFromTransactions = async (transactions) => {
  const addresses = uniq(flatten(transactions.map(t => ([t.to.toLowerCase(), t.from.toLowerCase()]))))
  // todo: implement case sensitive query
  return db.wallets.findAll({
    attributes: ['id', 'address', 'network'],
    where: {address: {[Op.or]: addresses}},
  })
}

const filterTransactionsByWallets = (transactions, wallets) => {
  const addresses = wallets.map(w => w.address.toLowerCase())
  return transactions.filter(t => addresses.includes(t.to.toLowerCase()) || addresses.includes(t.from.toLowerCase()))
}

const filterTransactionsByAddress = (transactions, address) =>
  transactions.filter(t =>
    t.to.toLowerCase() === address.toLowerCase() ||
    t.from.toLowerCase() === address.toLowerCase())

const updateTokenBalances = async (token, wallet, tokenTransactions, currentBlockTime) => {
  const balance = await getBalanceInEther(token, wallet)
  await updateBalance(token, wallet, balance)
  const {address} = wallet
  const addressTransactions = filterTransactionsByAddress(tokenTransactions, address.toLowerCase())
  return sendWalletMessage(token, wallet, addressTransactions, balance, currentBlockTime)
}

const tokensTransfersJob = async () =>
  db.tokens.findAll({where: {network: {[Op.eq]: network}}})
    .then(tokens => promiseSerial(tokens.map(token => async () => {
      const {transactions, toBlock, currentBlockTime} = await fetchLatestTransactions(token)

      if (transactions.length) {
        const wallets = await getWalletsFromTransactions(transactions)
        const tokenTransactions = filterTransactionsByWallets(transactions, wallets)
        const funcs = wallets.map(wallet =>
          () => updateTokenBalances(token, wallet, tokenTransactions, currentBlockTime))

        try {
          await promiseSerial(funcs)
        } catch (e) {
          logger.error(e)
        }

        if (tokenTransactions.length) {
          await insertTransactions(token, tokenTransactions, currentBlockTime)
        }
      }

      await updateLastReadBlock(token.id, toBlock)
    })))

module.exports = {
  start: async () => scheduleJob('tokensTransfers', tokenTransferCron, tokensTransfersJob),
  stop: async () => cancelJob('tokensTransfers'),
  fetchLastReadBlock,
}
