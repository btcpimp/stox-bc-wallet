const uuid = require('uuid')
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
  const dbTransaction = await context.db.sequelize.transaction()
  try {
    for (let i = 0; i < requests; i++) {
      const requestId = uuid()
      await services.pendingRequests.addPendingRequest('createWallet', requestId, dbTransaction)
      issueWallet(requestId)
    }
    await dbTransaction.commit()
  } catch (e) {
    logError(e, 'ERROR_CREATE_WALLETS')
    await dbTransaction.rollback()
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
