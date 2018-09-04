const {
  context: {mq, logger},
  services: {wallets},
} = require('stox-bc-wallet-common')

module.exports = async ({body: completedRequest}) => {
  if (!completedRequest.error) {
    const wallet = await wallets.getWalletByAddress(completedRequest.data.walletAddress)
    await wallets.updateWallet(wallet, {setWithdrawAddressAt: Date.now()})
    mq.publish('bc-assigned-wallets', {
      walletAddress: wallet.address,
    })
  } else {
    logger.error({requestId: completedRequest.id}, 'ERROR_SET_WITHDRAWAL_ADDRESS')
  }
}
