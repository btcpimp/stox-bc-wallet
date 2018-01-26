const schedule = require('node-schedule')
const {flatten} = require('lodash')
const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const {promiseSerial} = require('../promise')
const {network, tokenTransferCron} = require('app/config')
const {getBlockTime} = require('app/utils')
const {web3} = require('./blockchain')

const {Op} = Sequelize

const getLatestTransactions = async ({id, address}) => {
  const row = await db.tokensTransfersReads.findOne({
    attributes: ['lastReadBlockNumber'],
    where: {tokenId: {[Op.eq]: id}},
  })

  const fromBlock = row ? Number(row.lastReadBlockNumber) + 1 : 0
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
    logger.error(e, 'error connecting to blockcahin')
    throw e
  }
}

const filterByWallets = async (transactions) => {
  if (!transactions.length) {
    return transactions
  }

  const addresses = flatten(transactions.map(t => ([t.to, t.from])))
  const wallets = await db.wallets.findAll({
    attributes: ['address'],
    where: {address: {[Op.or]: addresses}},
  }).map(w => w.address)

  return transactions.filter(t => wallets.includes(t.to) || wallets.includes(t.from))
}

const updateDatabase = async (token, transactions, toBlock, currentBlockTime) =>
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
      logger.error(e, 'error in database')
      throw e
    }
  })

const doWork = async () =>
  db.tokens.findAll({where: {network: {[Op.eq]: network}}})
    .then(tokens => promiseSerial(tokens.map(token => async () => {
      const result = await getLatestTransactions(token)
      const {
        transactions,
        fromBlock,
        toBlock,
        currentBlock,
        currentBlockTime,
      } = result

      logger.info({
        network,
        token: token.name,
        transactions: transactions.length,
        fromBlock,
        toBlock,
        currentBlock,
        currentBlockTime: new Date(currentBlockTime).toUTCString(),
      }, 'READ')

      const walletsTransactions = await filterByWallets(transactions)
      await updateDatabase(token, walletsTransactions, toBlock, currentBlockTime)

      logger.info({
        network,
        token: token.name,
        count: walletsTransactions.length,
      }, 'WRITE')
    })))

const start = async () => {
  logger.info('reader started')
  let promise = null

  schedule.scheduleJob(tokenTransferCron, async () => {
    if (!promise) {
      logger.info('WORKING')
      promise = doWork()
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
