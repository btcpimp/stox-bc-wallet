const {times} = require('lodash')
const {loggers: {logger: baseLogger}} = require('@welldone-software/node-toolbelt')
const {services, context} = require('stox-bc-wallet-common')
const {walletsPoolThreshold, network, walletsPoolCron} = require('config')

// todo: query to see how much pending 'CREATE_WALLET' requests exist
const getRequestsCount = () => 480

const logger = baseLogger.child({name: 'walletsPool'})

const issueWallet = () => context.mq.publish('request-reader/create-requests', {type: 'CREATE_WALLET'})

const job = async () => {
  const {count} = await services.wallets.getUnassignedWalletsCount()
  const inQueue = await getRequestsCount('CREATE_WALLET')
  const requestsAmount = walletsPoolThreshold - count - inQueue

  logger.info(
    {
      network,
      count,
      inQueue,
      requestsAmount: requestsAmount < 0 ? 0 : requestsAmount,
    },
    'WALLETS_POOL'
  )

  if (requestsAmount > 0) {
    times(requestsAmount, issueWallet)
  }
}

module.exports = {
  cron: walletsPoolCron,
  job,
}
