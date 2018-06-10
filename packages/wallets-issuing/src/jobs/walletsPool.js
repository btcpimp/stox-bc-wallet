const {times} = require('lodash')
const uuid = require('uuid')
const {services, context, context: {mq}} = require('stox-bc-wallet-common')
const {walletsPoolThreshold, network, walletsPoolCron, requestManagerApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const httpClient = http(requestManagerApiBaseUrl)

const issueWallet = () =>{
  const id = uuid()
  mq.publish('incoming-requests', {
    id,
    type: 'createWallet',
  })
  return id
}


const warnIfNotEnoughInRequestManager = async (pending) => {
  try {
    const {count: rmPending} = await httpClient.get('requests/createWallet/count/pending')

    if (rmPending !== pending) {
      context.logger.warn(
        {
          requestMangerPendingCount: rmPending,
          bcWalletPendingCount: pending,
        },
        'Request-manager create wallet pending requests count, not consistent with bc-wallet'
      )
    }
  } catch (e) {
    context.logger.warn(e)
  }
}

const job = async () => {
  const {count: unassigned} = await services.wallets.getUnassignedWalletsCount()
  const pending = await services.pendingRequests.getCountByType('createWallet')
  const requests = Number(walletsPoolThreshold) - unassigned - pending
  for(let i = 0; i < requests; i++) {
    const requestId = issueWallet()
    await services.pendingRequests.addPendingRequests('createWallet', requestId)
  }

  await warnIfNotEnoughInRequestManager(pending)

  context.logger.info(
    {
      network,
      unassigned,
      pending,
      requests: requests < 0 ? 0 : requests,
      min: Number(walletsPoolThreshold),
    },
    'WALLETS_ISSUING'
  )
}

module.exports = {
  cron: walletsPoolCron,
  job,
}
