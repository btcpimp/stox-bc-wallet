const {wallets} = require('./services/wallets')
const {network} = require('config')

module.exports = {
  port: 3000,
  version: 1,
  cors: false,
  routes: (router, createApiEndpoint, secure) => {
    router.get('/wallets/balance', createApiEndpoint(({query: {address}}) => wallets.getWalletBalance(address, network)))
    router.post('/wallets/assign', createApiEndpoint(async ({body: {address}}) => wallets.assignWallet(address, network)))
    router.post('/wallets/create', createApiEndpoint(({body: {address}}) => wallets.createWallet(address, network)))
    router.post('/wallets/createWallets', createApiEndpoint(({body: {addresses}}) => wallets.createWallets(addresses, network)))
  },
}