const schedule = require('node-schedule')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const db = require('app/db')

const  start = async () => {

  schedule.scheduleJob('*/10 * * * * *', async () => {

    const wallet = await db.wallet.create(
      {
        address: new Date().getTime(),
        token: 'token',
        balance: 0,
        // assignedAt: new Date(),
        // createdAt: new Date()
      }
    )

    logger.info('new wallet', wallet)

  })
}

module.exports = {
  start
}
