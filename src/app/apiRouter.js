const {Router} = require('express')
const bodyParser = require('body-parser')
const {expressHelpers: {createApiEndpoint}} = require('@welldone-software/node-toolbelt')
const wallets = require('app/services/wallets')

const _ = createApiEndpoint
const router = new Router()

router.use(bodyParser.json())

router.post(
  '/wallets/balance',
  _(({body: {walletAddress}}) => wallets.getWalletBalance(walletAddress))
)

router.post(
  '/wallets/assign',
  _(({body: {withdrawAddress}}) => wallets.assignWallet(withdrawAddress))
)

module.exports = router
