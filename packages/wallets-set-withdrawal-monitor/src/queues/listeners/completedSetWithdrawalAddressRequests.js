const {
  context,
  services: {wallets},
} = require('stox-bc-wallet-common')

module.exports = async ({body: completedRequest}) => {
  if (!completedRequest.error) {
    const wallet = await wallets.getWalletByAddress(completedRequest.data.walletAddress)
    await wallets.updateWallet(wallet, {setWithdrawAddressAt: Date.now()})
  } else {
    context.logger.error(completedRequest, 'ERROR_SET_WITHDRAWAL_ADDRESS')
  }
}
