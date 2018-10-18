const {
  context,
  services: {wallets, pendingRequests},
} = require('stox-bc-wallet-common')

module.exports = async ({body: completedRequest}) => {
  await pendingRequests.finishPendingRequest(completedRequest.id)
  if (completedRequest.error) {
    context.logger.error(
      {
        transactions: completedRequest.transactions.map(transaction => transaction.transactionHash),
        requestId: completedRequest.id},
      'ERROR_SET_WITHDRAWAL_ADDRESS'
    )
  } else {
    const wallet = await wallets.getWalletByAddress(completedRequest.data.walletAddress)
    await wallet.updateAttributes({setWithdrawAddressAt: new Date()})
    context.mq.publish('bc-assigned-wallets', {
      walletAddress: wallet.address,
    })
    context.logger.info(completedRequest.id, 'SET_WITHDRAWAL_ADDRESS_SUCCESSFULLY')
  }
}
