const schedule = require('node-schedule')
const {flatten} = require('lodash')
const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const {promiseSerial} = require('../promise')

const {Op} = Sequelize

const getLatestTransactions = async ({address, name}) => {
  const row = await db.transactionsManagement.findOne({attributes: ['lastReadBlock'], where: {token: {[Op.eq]: name}}})
  const lastReadBlock = row ? Number(row.lastReadBlock) : 0
  const result = await tokenTracker.getLatestTransferTransactions(address, lastReadBlock)
  const length = result.transactions && result.transactions.length

  logger.info({address, fromBlock: lastReadBlock, found: length}, 'READ')

  return result
}

const updateDatabase = async (token, toBlock, transactions) => {
  const {address, name} = token
  return db.sequelize.transaction().then(async (transaction) => {
    const tokenValues = await db.transactionsManagement.findOne({where: {token: name}})
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
          network: 'MAIN',
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
      logger.info({address, toBlock, count: transactions.length}, 'WRITE')
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

const doWork = async () => {
  const tokens = await db.tokens.findAll()
  const funcs = tokens.map(token => () => fetchLatestTransactions(token))

  promiseSerial(funcs).catch(e => logger.error(e))
}

const start = async () => {
  logger.info('TransactionLog started')

  let working = false

  schedule.scheduleJob('2 * * * * *', async () => {
    if (!working) {
      working = !working

      doWork()

      working = !working
    }
  })
}

module.exports = {
  start,
}
