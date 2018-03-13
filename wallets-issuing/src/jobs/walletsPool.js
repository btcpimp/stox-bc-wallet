const {times} = require('lodash')
const uuid = require('uuid')
const {loggers: {logger: baseLogger}} = require('@welldone-software/node-toolbelt')
const {services, context} = require('stox-bc-wallet-common')
const {walletsPoolThreshold, network, walletsPoolCron} = require('config')

// todo: query to see how much pending 'CREATE_WALLET' requests exist
const getPendingRequestsCount = () => 491

const logger = baseLogger.child({name: 'walletsPool'})

const issueWallet = () => context.mq.publish('incomingRequests', {
  id: uuid(),
  type: 'createWallet',
})

const job = async () => {
  const {count} = await services.wallets.getUnassignedWalletsCount()
  const pending = await getPendingRequestsCount('createWallet')
  const requests = walletsPoolThreshold - count - pending

  logger.info(
    {
      network,
      unassigned: count,
      pending,
      requests: requests < 0 ? 0 : requests,
    },
    'WALLETS_POOL'
  )

  if (requests > 0) {
    times(requests, issueWallet)
  }
}

module.exports = {
  cron: walletsPoolCron,
  job,
}
