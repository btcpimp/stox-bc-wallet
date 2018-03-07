const {port} = require('config')
const {services: {wallets, tokensBalances}} = require('stox-bc-wallet-common')

module.exports = {
  port,
  version: 1,
  routes: (router, _) => {
    router.get(
      '/unassigned/count',
      _(() => wallets.getUnassignedWalletsCount())
    )
    router.get(
      '/balance',
      _(({query: {address}}) => tokensBalances.getBalance(address))
    )
    router.post(
      '/assign',
      _(({body: {address}}) => wallets.assignWallet(address))
    )
    router.post(
      '/create',
      _(({body: {address}}) => wallets.createWallet(address))
    )
    router.post(
      '/createWallets',
      _(({body: {addresses}}) => wallets.createWallets(addresses))
    )
    router.get(
      '/wallets/blockchainBalance',
      _(({query: {address}}) => wallets.getWalletBalanceInBlockchain(address))
    )
  },
}
