const {db} = require('stox-bc-wallet-common')
const {network, port} = require('config')
const walletService = require('./services/wallets')

module.exports = {
  port,
  version: 1,
  cors: false,
  routes: (router, _) => {
    router.get('/wallets/unassigned/count', _(() => {
      db.wallets.getUnassignedWalletsCount(network)
    }))
    router.get('/wallets/balance', _(({query: {address}}) => walletService.getWalletBalance(address, network)))
    router.post('/wallets/assign', _(({body: {address}}) => walletService.assignWallet(address, network)))
    router.post('/wallets/create', _(({body: {address}}) => walletService.createWallet(address, network)))
    router.post('/wallets/createWallets', _(({body: {addresses}}) => walletService.createWallets(addresses, network)))
  },
}
