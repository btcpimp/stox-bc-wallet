const schedule = require('node-schedule')
const {flatten} = require('lodash')
const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const {promiseSerial} = require('../promise')
const {network} = require('app/config')

const {Op} = Sequelize

const getLatestTransactions = async ({address, name}) => {
  const row = await db.transactionsManagement.findOne({attributes: ['lastReadBlock'], where: {token: {[Op.eq]: name}}})
  const lastReadBlock = row ? Number(row.lastReadBlock) : 0
  logger.info({token: name.trim(), fromBlock: lastReadBlock}, 'READ')

  try {
    return await tokenTracker.getLatestTransferTransactions(address, lastReadBlock)
  } catch (e) {
    logger.error(e, 'Error connecting to WEB3.')
    throw e
  }
}

const updateDatabase = async (token, toBlock, transactions) => {
  const {address, name} = token
  return db.sequelize.transaction().then(async (transaction) => {
    const tokenValues = await db.transactionsManagement.findOne({where: {token: {[Op.eq]: name}}})
    await tokenValues.updateAttributes({lastReadBlock: toBlock}, {transaction})
    await Promise.all(transactions.map(async (t) => {
      const {
        amount,
        blockNumber,
        from,
        to,
        transactionHash,
        transactionIndex,
        event,
      } = t

      return db.transactions.create(
        {
          transactionHash,
          transactionIndex,
          address,
          network,
          blockNumber: Number(blockNumber),
          from,
          to,
          amount: Number(amount),
          rawData: event,
        },
        {transaction}
      )
    }))

    try {
      await transaction.commit()
      logger.info({token: name.trim(), toBlock, found: transactions.length}, 'WRITE')
    } catch (e) {
      transaction.rollback()
      logger.error(e)
      throw e
    }
  })
}

const filterTransactions = async (transactions) => {
  if (!transactions.length) {
    return transactions
  }

  const addresses = flatten(transactions.map(t => ([t.to, t.from])))
  const wallets = await db.wallets.findAll({where: {address: {[Op.or]: addresses}}}).map(w => w.address)

  return transactions.filter(t => wallets.includes(t.to))
}

const fetchLatestTransactions = async (token) => {
  const {transactions, toBlock} = await getLatestTransactions(token)
  const relevantTransactions = await filterTransactions(transactions)

  await updateDatabase(token, toBlock, relevantTransactions)
}

const doWork = async () =>
  db.tokens.findAll().then(tokens => promiseSerial(tokens.map(token => () => fetchLatestTransactions(token))))

const start = async () => {
  logger.info('TransactionLog started')

  let working = false

  schedule.scheduleJob('*/10 * * * * *', async () => {
    if (!working) {
      working = !working

      doWork().catch(e => logger.error(e))

      working = !working
    }
  })
}

module.exports = {
  start,
}
