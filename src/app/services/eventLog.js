const schedule = require('node-schedule')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')

const start = async () => {

  const tokens = await db.token.findAll()
  const settings = await db.eventLogsSettings.findAll()

  const balance = await tokenTracker.getAccountBalanceInEther(tokens[0].address, '0x15593BCF5357a1975e5069EDF54b24F28B8D2C02')
  console.log({balance})

  tokens.map(async (t) => {
    const tokenLastBlock = settings.find(s => s.tokenAddress === t.address)

    try  {
      const events = await tokenTracker.getLatestTransferTransactions(t.address, tokenLastBlock.lastReadBlockAddress)
      console.log('events', events)
    }
    catch(e) {
      console.error('e', e)
    }
  })

  // schedule.scheduleJob('*/10 * * * * *', async () => {
  //
  //   // get tokens from db
  //   // for each row call tokenTracker.getLatestTransferTransactions
  //
  //
  //   //
  //   // const token = await db.token.create({
  //   //   address: value,
  //   //   name: value,
  //   // })
  //   //
  //   // logger.info('new token', token)
  //   //
  //   // const eventLogsSettings = await db.eventLogsSettings.create({
  //   //   tokenAddress: value,
  //   //   lastReadBlockAddress: value,
  //   // })
  //   //
  //   // logger.info('new eventLogsSettings', eventLogsSettings)
  //   //
  //   // const eventLog = await db.eventLogs.create({
  //   //   txHash: value,
  //   //   block: value,
  //   //   token: value,
  //   //   from: value,
  //   //   to: value,
  //   //   amount: 5,
  //   // })
  //   //
  //   // logger.info('new eventLog', eventLog)
  //   //
  //   // const wallet = await db.wallet.create({
  //   //   address: value,
  //   //   token: value,
  //   //   balance: value,
  //   // })
  //   //
  //   // logger.info('new eventLog', wallet)
  //
  // })
}

module.exports = {
  start,
}
