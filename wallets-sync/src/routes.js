const {port} = require('./config')
const wallets = require('common/services/wallets')

module.exports = {
  port,
  version: 1,
  routes: (router, createEndPoint) => {
    const _ = createEndPoint
    router.post('/wallets/assign', _(async ({body: {address}}) => wallets.assign(address)))
    router.get('/wallets/unassigned/count', _(() => wallets.getUnassignedWalletsCount()))
    router.get('/wallets/ABI', _(({body: {address}}) => wallets.getWalletABI(address)))
  },
  cors: false,
}
