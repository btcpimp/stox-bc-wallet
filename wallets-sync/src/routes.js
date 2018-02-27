const wallets = require('common/services/wallets')

module.exports = (router, createEndPoint) => {
  router.post('/wallets/assign', createEndPoint(async ({body: {address}}) => wallets.assign(address)))
  router.get('/wallets/unassigned/count', createEndPoint(() => wallets.getUnassignedWalletsCount()))
  router.get('/wallets/ABI', createEndPoint(({body: {address}}) => wallets.getWalletABI(address)))
}
