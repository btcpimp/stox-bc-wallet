const schedule = require('node-schedule')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')

const start = async () => {
  // const value = new Date().getTime()

  schedule.scheduleJob('*/10 * * * * *', async () => {
    //
    // const token = await db.token.create({
    //   address: value,
    //   name: value,
    // })
    //
    // logger.info('new token', token)
    //
    // const eventLogsSettings = await db.eventLogsSettings.create({
    //   tokenAddress: value,
    //   lastReadBlockAddress: value,
    // })
    //
    // logger.info('new eventLogsSettings', eventLogsSettings)
    //
    // const eventLog = await db.eventLogs.create({
    //   txHash: value,
    //   block: value,
    //   token: value,
    //   from: value,
    //   to: value,
    //   amount: 5,
    // })
    //
    // logger.info('new eventLog', eventLog)
    //
    // const wallet = await db.wallet.create({
    //   address: value,
    //   token: value,
    //   balance: value,
    // })
    //
    // logger.info('new eventLog', wallet)

  })
}

module.exports = {
  start,
}
