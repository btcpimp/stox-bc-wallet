const {
  services: {contractsTrackingData, wallets, blockchain: {smartWallets}},
  context: {db, mq, blockchain},
  context,
} = require('stox-bc-wallet-common')
const {network, selfWithdrawCron, withdrawalConfigurationAddress} = require('../config')
const promiseSerial = require('promise-serial')
const {errors: {logError}} = require('stox-common')

const withdrawalConfigurationId = `${network}.${withdrawalConfigurationAddress}`

const getLatestSelfWithdrawRequests = async (fromBlock, toBlock) => {
  const withdrawalConfigurationContract = blockchain.getWithdrawalConfigurationContract(withdrawalConfigurationAddress)
  const events = await withdrawalConfigurationContract.getPastEvents('WithdrawalRequested', {fromBlock, toBlock})
  context.logger.info({fromBlock, toBlock, withdrawRequestsCount: events.length})
  return events
}

const getWalletFromDb = async (address) => {
  try {
    return await wallets.getWalletByAddress(address)
  } catch (e) {
    return false
  }
}

const job = async () => {
  const {fromBlock, toBlock} = await contractsTrackingData.getNextBlocksRange(withdrawalConfigurationId)
  if (fromBlock < toBlock) {
    const withdrawRequests = await getLatestSelfWithdrawRequests(fromBlock, toBlock)
    const dbTransaction = await db.sequelize.transaction()
    try {
      if (withdrawRequests.length) {
        await promiseSerial(withdrawRequests.map(({returnValues: {_smartWallet}}) => async () => {
          const wallet = await getWalletFromDb(_smartWallet)
          if (!wallet) {
            context.logger.error(`wallet not found ${_smartWallet}`)
            return
          }
          const {withdrawAllowedAt} = await smartWallets.getWalletProperties(_smartWallet)
          if (withdrawAllowedAt) {
            const selfWithdrawAllowedAt = new Date(withdrawAllowedAt * 1000)
            await wallet.updateAttributes(
              {selfWithdrawRequestedAt: Date.now(), selfWithdrawAllowedAt},
              {transaction: dbTransaction}
            )
            mq.publish('user-withdraw-requested', {
              walletAddress: _smartWallet,
              selfWithdrawAllowedAt,
            })
          }
        }))
      }
      await contractsTrackingData.updateLastReadBlock(withdrawalConfigurationId, toBlock, dbTransaction)
      await dbTransaction.commit()
    } catch (e) {
      logError(e, 'SelfWithdrawRequests failed')
      dbTransaction.rollback()
    }
  }
}

module.exports = {
  cron: selfWithdrawCron,
  job,
}
