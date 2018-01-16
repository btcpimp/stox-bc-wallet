const schedule = require('node-schedule')
const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')

const {Op} = Sequelize

const seedDb = async () => {
  const createToken = async () => db.token.create({
    address: '0x006BeA43Baa3f7A6f765F14f10A1a1b08334EF45',
    name: 'STX',
  })

  const createWallet = async () => db.wallet.create({
    address: '0x15593BCF5357a1975e5069EDF54b24F28B8D2C02',
  })

  const createLogSettings = async () => db.eventLogsSettings.create({
    tokenAddress: '0x006BeA43Baa3f7A6f765F14f10A1a1b08334EF45',
    lastReadBlock: 0,
  })

  try {
    await createToken()
    await createWallet()
    await createLogSettings()
  }
  catch (e) {
    logger.error(e.original.message)
  }
}

const getLastReadBlock = async (address) => {
  const tokenSettings = await db.eventLogsSettings.findOne({
    attributes: ['lastReadBlock'],
    where: {
      tokenAddress: {
        [Op.eq]: address,
      },
    },
  })

  return tokenSettings ? tokenSettings.lastReadBlock : 0
}

const getWallets = async addresses => db.wallet.findAll({
  attributes: ['address'],
  where: {
    address: {
      [Op.or]: addresses,
    },
  },
})

const getLatestTransactions = async (address, lastReadBlock) => {
  const {transactions, toBlock} = await tokenTracker.getLatestTransferTransactions(address, lastReadBlock)
  const addresses = transactions.map(t => t.to)
  const wallets = await getWallets(addresses)
  const relevantTransactions = transactions.filter(t => wallets.includes(t.to))

  return {
    transactions: relevantTransactions,
    toBlock,
  }
}

const updateDatabase = async (address, toBlock, transactions) => {
  await db.sequelize.transaction().then(async (transaction) => {
    const tokenSettings = await db.eventLogsSettings.findOne({
      where: {tokenAddress: address},
    })
    await tokenSettings.updateAttributes(
      {lastReadBlock: toBlock},
      {transaction}
    )

    const promises = transactions.map(async ({amount, blockNumber, from, to, transactionHash}) =>
      db.eventLogs.create(
        {
          tokenAddress: address,
          transactionHash,
          blockNumber: Number(blockNumber),
          from,
          to,
          amount: Number(amount),
        },
        {transaction}
      ))

    await Promise.all(promises)

    try {
      await transaction.commit()
    } catch (e) {
      transaction.rollback()
      logger.error(e)
      throw e
    }
  })
}

const fetchLatestTransactions = async (address) => {
  const lastReadBlock = await getLastReadBlock(address)
  const {toBlock, transactions} = await getLatestTransactions(address, lastReadBlock)

  try {
    logger.info({address, fromBlock: lastReadBlock, toBlock, found: transactions.length}, 'READ')
    await updateDatabase(address, toBlock, transactions)
    logger.info({address, count: transactions.length}, 'WRITE')
  }
  catch (e) {
    logger.error(e.original.message)
  }
}

const fetchAllTokens = async () => {
  const tokens = await db.token.findAll()
  return Promise.all(tokens.map(async ({address}) => fetchLatestTransactions(address)))
}

const start = async () => {
  // await seedDb()

  let working = false
  schedule.scheduleJob('*/10 * * * * *', async () => {
    if (!working) {
      working = !working

      try {
        await fetchAllTokens()
      }
      catch (e) {
        logger.error(e)
      }

      working = !working
    }
  })
}

module.exports = {
  start,
}
