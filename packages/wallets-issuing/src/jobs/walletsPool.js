const {services, context, context: {mq}} = require('stox-bc-wallet-common')
const {walletsPoolThreshold, network, walletsPoolCron, requestManagerApiBaseUrl} = require('../config')
const {http, errors: {logError}} = require('stox-common')

const httpClient = http(requestManagerApiBaseUrl)

const issueWallet = (id) => {
  mq.publish('incoming-requests', {
    id,
    type: 'createWallet',
  })
}


const warnIfNotEnoughInRequestManager = async (pending) => {
  try {
    const {count: rmPending} = await httpClient.get('requests/createWallet/count/pending')

    if (Math.abs(rmPending - pending) > 20) {
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
  try {
    for (let i = 0; i < requests; i++) {
      const requestId = await services.pendingRequests.addPendingRequest('createWallet')
      issueWallet(requestId)
    }
  } catch (e) {
    logError(e, 'ERROR_CREATE_WALLETS')
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
