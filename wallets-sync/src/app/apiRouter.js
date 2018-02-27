const wallets = require('wallet-common/src/services/wallets')
const tokensTransfers = require('wallet-common/src/services/tokensTransfers')
const tokensBalances = require('wallet-common/src/services/tokensBalances')

const initRoutes = (router, _) => {
  router.post(
    '/wallets/create',
    _(({body: {address}}) => wallets.createWallet(address))
  )

  router.post(
    '/wallets/createWallets',
    _(({body: {addresses}}) => wallets.createWallets(addresses))
  )

  router.post(
    '/wallets/assign',
    _(({body: {withdrawAddress}}) => wallets.assignWallet(withdrawAddress))
  )

  router.get(
    '/wallets/balance',
    _(({query: {address}}) => wallets.getWalletBalance(address))
  )

  router.get(
    '/wallets/unassigned/count',
    _(() => wallets.getUnassignedWalletsCount())
  )

  router.post(
    '/tokens/transfers/start',
    _(() => tokensTransfers.start())
  )

  router.post(
    '/tokens/transfers/stop',
    _(() => tokensTransfers.stop())
  )

  router.post(
    '/tokens/balances/start',
    _(() => tokensBalances.start())
  )

  router.post(
    '/tokens/balances/stop',
    _(() => tokensBalances.stop())
  )
}

module.exports = {initRoutes}