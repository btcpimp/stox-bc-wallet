const {times} = require('lodash')
const uuid = require('uuid')
const {loggers: {logger: baseLogger}} = require('@welldone-software/node-toolbelt')
const {services, context} = require('stox-bc-wallet-common')
const {walletsPoolThreshold, network, walletsPoolCron, requestManagerApiBaseUrl} = require('config')
const {http} = require('stox-common')
const clientHttp = http(requestManagerApiBaseUrl)

const getPendingRequestsCount = async (type) => await clientHttp.get(`requests/${type}/count/pending`)

const logger = baseLogger.child({name: 'walletsPool'})

const issueWallet = () => context.mq.publish('incomingRequests', {
  id: uuid(),
  type: 'createWallet',
  data: {},
})

const job = async () => {
  const {count: unassigned} = await services.wallets.getUnassignedWalletsCount()
  const {count: pending} = await getPendingRequestsCount('createWallet')

  const requests = walletsPoolThreshold - unassigned - pending

  logger.info(
    {
      network,
      unassigned,
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
