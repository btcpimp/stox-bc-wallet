const {createDatabaseServices} = require('stox-bc-wallet-common')
const {network} = require('config')

module.exports = {
  port: 3001,
  version: 1,
  cors: false,
  routes: (router, createApiEndpoint) => {
    router.get('/wallets/unassigned/count', createApiEndpoint(() => {
      const {wallets} = createDatabaseServices(context)
      wallets.getUnassignedWalletsCount(network)
    }))
  },
}
