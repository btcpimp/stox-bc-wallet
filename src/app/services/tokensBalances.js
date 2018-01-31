const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const {network, updateBalanceCron} = require('app/config')
const {scheduleJob, cancelJob} = require('../scheduleUtils')

const {Op} = Sequelize

const updateTokensBalances = async () =>
  db.sequelize.transaction({lock: Sequelize.Transaction.LOCK.UPDATE})
    .then(async (transaction) => {
      try {
        const tokenBalance = await db.tokensBalances.findOne({
          where: {pendingUpdateBalance: {[Op.gt]: 0}},
          transaction,
        })

        if (tokenBalance) {
          const {walletId, tokenId} = tokenBalance
          const walletAddress = walletId.split('.').pop()
          const tokenAddress = tokenId.split('.').pop()
          const {balance} = await tokenTracker.getAccountBalanceInEther(tokenAddress, walletAddress)

          await tokenBalance.update(
            {
              balance,
              pendingUpdateBalance: 0,
            },
            {
              where: {
                walletId,
                tokenId,
              },
            },
            {transaction}
          )

          logger.info({
            network,
            tokenAddress,
            walletAddress,
            balance,
          }, 'UPDATE_BALANCE')
        }

        transaction.commit()
      } catch (e) {
        transaction.rollback()
        throw new UnexpectedError('updateBalanceFailed', e)
      }
    })

module.exports = {
  start: async () => scheduleJob('tokensBalances', updateBalanceCron, updateTokensBalances),
  stop: async () => cancelJob('tokensBalances'),
}
