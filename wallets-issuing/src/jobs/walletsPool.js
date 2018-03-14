const {times} = require('lodash')
const uuid = require('uuid')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {services, context: {mq}} = require('stox-bc-wallet-common')
const {walletsPoolThreshold, network, walletsPoolCron, requestManagerApiBaseUrl} = require('config')
const {http} = require('stox-common')

const httpClient = http(requestManagerApiBaseUrl)

const getPendingRequestsCount = type => httpClient.get(`requests/${type}/count/pending`)

const issueWallet = () => mq.publish('incomingRequests', {
  id: uuid(),
  type: 'createWallet',
  data: {}, // required by mq on request-reader
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
