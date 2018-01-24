const schedule = require('node-schedule')
const {flatten} = require('lodash')
const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const {promiseSerial} = require('../promise')
const {network} = require('app/config')

const {Op} = Sequelize

const getLatestTransactions = async ({id, name, address}) => {
  const row = await db.tokensTransfersReads.findOne({
    attributes: ['lastReadBlockNumber'],
    where: {tokenId: {[Op.eq]: id}},
  })
  const lastReadBlockNumber = row ? Number(row.lastReadBlockNumber) : 0
  logger.info({network, token: name, fromBlock: lastReadBlockNumber}, 'READ')

  try {
    return await tokenTracker.getLatestTransferTransactions(address, lastReadBlockNumber)
  } catch (e) {
    logger.error(e, 'Error connecting to blockcahin')
    throw e
  }
}

const filterTransactions = async (transactions) => {
  if (!transactions.length) {
    return transactions
  }

  const addresses = flatten(transactions.map(t => ([t.to, t.from])))
  const wallets = await db.wallets.findAll({
    attributes: ['address'],
    where: {address: {[Op.or]: addresses}},
  }).map(w => w.address)

  return transactions.filter(t => wallets.includes(t.to))
}

const updateDatabase = async (token, toBlock, transactions) =>
  db.sequelize.transaction().then(async (transaction) => {
    const tokenValues = await db.tokensTransfersReads.findOne({where: {tokenId: {[Op.eq]: token.id}}})
    await tokenValues.updateAttributes({lastReadBlockNumber: toBlock}, {transaction})
    await Promise.all(transactions.map(async (t) => {
      const {
        amount,
        blockNumber,
        transactionIndex,
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
          transactionIndex,
          tokenId: token.id,
          network,
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
      logger.info({network, token: token.name, toBlock, found: transactions.length}, 'WRITE')
    } catch (e) {
      transaction.rollback()
      logger.error(e, 'Error in database')
      throw e
    }
  })

const doWork = async () =>
  db.tokens.findAll({where: {network: {[Op.eq]: network}}})
    .then(tokens => promiseSerial(tokens.map(token => async () => {
      const {transactions, toBlock} = await getLatestTransactions(token)
      const walletsTransactions = await filterByWallets(transactions)
      await updateDatabase(token, toBlock, walletsTransactions)
    })))

const start = async () => {
  logger.info('Transaction reader started')
  let working = false

  schedule.scheduleJob('*/10 * * * * *', async () => {
    if (!working) {
      working = !working
      doWork().catch(e => logger.error(e.original ? e.original : e))
      working = !working
    }
  })
}

module.exports = {
  start,
}
