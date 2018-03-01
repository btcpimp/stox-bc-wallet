const {mq, db} = require('stox-common')
const Sequelize = require('sequelize')
const {loggers: {logger: baseLogger}} = require('@welldone-software/node-toolbelt')
const {minimumWalletPoolThreshold, network} = require('config')

const {Op} = Sequelize

const logger = baseLogger.child({name: 'walletsPool'})

const getUnassignedWalletsCount = async () => {
  const count = await db.wallets.count({
    where: {
      [Op.and]: [
        {assignedAt: {[Op.eq]: null}},
        {setWithdrawAddressAt: {[Op.eq]: null}},
        {corruptedAt: {[Op.eq]: null}},
        {network: {[Op.eq]: network}},
      ],
    },
  })

  return count
}

const issueWallets = amount => mq.publish('request-reader/create-requests', {
  type: 'create_wallet',
  requestData: amount,
})

module.exports = {
  cron: '*/30 * * * * *',
  job: async () => {
    const unassigned = await getUnassignedWalletsCount()
    if (unassigned >= minimumWalletPoolThreshold) {
      logger.debug(
        {unassigned, minimumWalletPoolThreshold},
        'Unassigned wallet pool size bigger then minimum threshold'
      )
      return
    }

    const requestAmount = minimumWalletPoolThreshold - unassigned
    issueWallets(requestAmount)
  },
}
