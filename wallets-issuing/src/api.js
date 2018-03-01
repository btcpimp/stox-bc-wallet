const wallets = require('./services/db/wallets')
const {network} = require('config')

module.exports = {
  port: 3001,
  version: 1,
  cors: false,
  routes: (router, createApiEndpoint) => {
    router.get('/wallets/unassigned/count', createApiEndpoint(() => wallets.getUnassignedWalletsCount(network)))
  },
}