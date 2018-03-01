const Sequelize = require('sequelize')
const {times} = require('lodash')
const {mq, db} = require('stox-common')
const {loggers: {logger: baseLogger}} = require('@welldone-software/node-toolbelt')
const {getUnassignedWalletsCount} = require('../services/db/wallets')
const {walletsPoolThreshold, network} = require('config')

// todo: query to see how much pending 'CREATE_WALLET' requests exist
const getRequestsCount = () => 500

const {Op} = Sequelize
const logger = baseLogger.child({name: 'walletsPool'})

const issueWallet = () => mq.publish('request-reader/create-requests', {type: 'CREATE_WALLET'})

module.exports = {
  cron: '*/30 * * * * *',
  job: async () => {
    const {count} = await getUnassignedWalletsCount(network)
    const inQueue = await getRequestsCount(network, 'CREATE_WALLET')
    const requestsAmount = walletsPoolThreshold - count - inQueue

    logger.info({
      network,
      count,
      inQueue,
      requestsAmount: requestsAmount < 0 ? 0 : requestsAmount
    }, 'WALLETS_POOL')

    if (requestsAmount > 0) {
      times(requestsAmount, issueWallet)
    }
  },
}
