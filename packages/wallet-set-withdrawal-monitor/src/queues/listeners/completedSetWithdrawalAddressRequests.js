const {
  services: {wallets},
} = require('stox-bc-wallet-common')

module.exports = async ({body: completedRequest}) => {
  if (!completedRequest.error) {
    const wallet = await wallets.getWalletByAddress(completedRequest.data.walletAddress)
    await wallets.updateWallet(wallet, {setWithdrawAddressAt: Date.now()})
  }

}
