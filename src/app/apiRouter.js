const {Router} = require('express')
const bodyParser = require('body-parser')
const {expressHelpers: {createApiEndpoint}} = require('@welldone-software/node-toolbelt')
const wallets = require('../../common/services/wallets')
const tokensTransfers = require('../../common/services/tokensTransfers')
const tokensBalances = require('../../common/services/tokensBalances')

const _ = createApiEndpoint
const router = new Router()

router.use(bodyParser.json())

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

module.exports = router
