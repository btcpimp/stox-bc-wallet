const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const tokenTracker = require('../services/tokenTracker')
const tokenTransfers = require('../services/tokensTransfers')

// todo - change to opts
const {network, updateBalanceCron} = require('../../../wallets-sync/src/app/config')

const {Op} = Sequelize

const updateTokensBalancesJob = async () =>
  db.sequelize.transaction()
    .then(async (transaction) => {
      try {
        const tokenBalance = await db.tokensBalances.findOne({
          where: {pendingUpdateBalance: {[Op.gt]: 0}},
          lock: Sequelize.Transaction.LOCK.UPDATE,
          transaction,
        })

        if (tokenBalance) {
          const {walletId, tokenId} = tokenBalance
          const walletAddress = walletId.split('.').pop().toLowerCase()
          const tokenAddress = tokenId.split('.').pop().toLowerCase()
          const {balance} = await tokenTracker.getAccountBalanceInEther(
            tokenAddress,
            walletAddress,
            await tokenTransfers.fetchLastReadBlock(tokenId)
          )

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
        throw new UnexpectedError('update balance failed', e)
      }
    })

module.exports = {
  updateTokensBalancesJob
}
