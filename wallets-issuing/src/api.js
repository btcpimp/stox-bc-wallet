const {createDatabaseServices} = require('stox-bc-wallet-common')
const {network, port} = require('config')

module.exports = {
  port,
  version: 1,
  cors: false,
  routes: (router, createApiEndpoint) => {
    router.get('/wallets/unassigned/count', createApiEndpoint(() => {
      const {wallets} = createDatabaseServices(context)
      wallets.getUnassignedWalletsCount(network)
    }))
  },
}
