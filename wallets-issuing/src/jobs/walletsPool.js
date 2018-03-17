const {times} = require('lodash')
const uuid = require('uuid')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {services, context: {mq}} = require('stox-bc-wallet-common')
const {walletsPoolThreshold, network, walletsPoolCron, requestManagerApiBaseUrl} = require('config')
const {http} = require('stox-common')

const httpClient = http(requestManagerApiBaseUrl)

const getPendingRequestsCount = () => httpClient.get('requests/createWallet/count/pending')

const issueWallet = () => mq.publish('incomingRequests', {
  id: uuid(),
  type: 'createWallet',
})

const job = async () => {
  const {count: unassigned} = await services.wallets.getUnassignedWalletsCount()
  const {count: pending} = await getPendingRequestsCount()

  const requests = Number(walletsPoolThreshold) - unassigned - pending

  // todo: get number of messages in queue and substract from requests to add

  logger.info(
    {
      network,
      unassigned,
      pending,
      requests: requests < 0 ? 0 : requests,
      min:  Number(walletsPoolThreshold),
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
