const {
  context,
  services: {wallets, pendingRequests},
} = require('stox-bc-wallet-common')

module.exports = async ({body: completedRequest}) => {
  const dbTransaction = await context.db.sequelize.transaction()
  try {
    if (completedRequest.error) {
      throw completedRequest.error
    }
    await pendingRequests.destroyPendingRequest(completedRequest.id, dbTransaction)
    const wallet = await wallets.getWalletByAddress(completedRequest.data.walletAddress)
    await wallet.updateAttributes({setWithdrawAddressAt: new Date()}, dbTransaction)
    context.mq.publish('bc-assigned-wallets', {
      walletAddress: wallet.address,
    })
    context.logger.info(completedRequest.id, 'SET_WITHDRAWAL_ADDRESS_SUCCESSFULLY')
  } catch (e) {
    context.logger.error({...e, requestId: completedRequest.id}, 'ERROR_SET_WITHDRAWAL_ADDRESS')
  }
  await dbTransaction.commit()
}
