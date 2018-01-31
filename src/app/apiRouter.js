const {Router} = require('express')
const bodyParser = require('body-parser')
const {expressHelpers: {createApiEndpoint}} = require('@welldone-software/node-toolbelt')
const wallets = require('app/services/wallets')
const tokensTransfers = require('app/services/tokensTransfers')
const tokensBalances = require('app/services/tokensBalances')

const _ = createApiEndpoint
const router = new Router()

router.use(bodyParser.json())

router.post(
  '/wallets/create',
  _(({body: {address}}) => wallets.createWallet(address))
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
  '/wallets/mock',
  _(() => wallets.mockWallets())
)

router.get(
  '/tokens/transfers/start',
  _(() => tokensTransfers.start())
)

router.get(
  '/tokens/transfers/stop',
  _(() => tokensBalances.stop())
)

router.get(
  '/tokens/balances/start',
  _(() => tokensBalances.start())
)

router.get(
  '/tokens/balances/stop',
  _(() => tokensBalances.stop())
)

module.exports = router
