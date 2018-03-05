const {times} = require('lodash')
const {mq} = require('stox-common')
const {loggers: {logger: baseLogger}} = require('@welldone-software/node-toolbelt')
const context = require('context')
const {createDatabaseServices} = require('stox-bc-wallet-common')
const {walletsPoolThreshold, network} = require('config')

// todo: query to see how much pending 'CREATE_WALLET' requests exist
const getRequestsCount = () => 500

const logger = baseLogger.child({name: 'walletsPool'})

const issueWallet = () => mq.publish('request-reader/create-requests', {type: 'CREATE_WALLET'})

module.exports = {
  cron: '*/30 * * * * *',
  job: async () => {
    const {wallets} = createDatabaseServices(context)
    const {count} = await wallets.getUnassignedWalletsCount(network)
    const inQueue = await getRequestsCount(network, 'CREATE_WALLET')
    const requestsAmount = walletsPoolThreshold - count - inQueue

    logger.info({
      network,
      count,
      inQueue,
      requestsAmount: requestsAmount < 0 ? 0 : requestsAmount,
    }, 'WALLETS_POOL')

    if (requestsAmount > 0) {
      times(requestsAmount, issueWallet)
    }
  },
}
