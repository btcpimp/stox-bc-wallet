const {wallets} = require('common')
const {network} = require('config')

module.exports = (router, createEndPoint) => {
  router.post('/wallets/assign', createEndPoint(async ({body: {address}}) => wallets.assignWallet(address, network)))
  router.get('/wallets/unassigned/count', createEndPoint(() => wallets.getUnassignedWalletsCount(network)))
  router.post('/wallets/create', createEndPoint(({body: {address}}) => wallets.createWallet(address, network)))

  router.post(
    '/wallets/createWallets',
    createEndPoint(({body: {addresses}}) => wallets.createWallets(addresses, network))
  )

  router.get('/wallets/balance', createEndPoint(({query: {address}}) => wallets.getWalletBalance(address, network)))

  // how to stop a job through api?
  // router.post('/tokens/transfers/start', createEndPoint(() => tokensTransfers.start()))
  //
  // router.post('/tokens/transfers/stop', createEndPoint(() => tokensTransfers.stop()))
  //
  // router.post('/tokens/balances/start', createEndPoint(() => tokensBalances.start()))
  //
  // router.post('/tokens/balances/stop', createEndPoint(() => tokensBalances.stop()))
  // router.get('/wallets/ABI', createEndPoint(({body: {address}}) => wallets.getWalletABI(address)))
}
