const {port} = require('config')
const {services: {db}} = require('stox-bc-wallet-common')

module.exports = {
  port,
  version: 1,
  routes: (router, _) => {
    router.get('/unassigned/count', _(() => db.wallets.getUnassignedWalletsCount()))
    router.get('/balance', _(({query: {address}}) => db.tokensBalances.getBalance(address)))
    router.post('/assign', _(({body: {address}}) => db.wallets.assignWallet(address)))
    router.post('/create', _(({body: {address}}) => db.wallets.createWallet(address)))
    router.post('/createWallets', _(({body: {addresses}}) => db.wallets.createWallets(addresses)))
  },
}
