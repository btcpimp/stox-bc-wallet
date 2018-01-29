const {Router} = require('express')
const bodyParser = require('body-parser')
const {expressHelpers: {createApiEndpoint}} = require('@welldone-software/node-toolbelt')
const wallets = require('app/services/wallets')
const blockchainReader = require('app/services/blockchainReader')

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

router.get(
  '/tokens/transfers/start',
  _(() => blockchainReader.startTokensTransfers())
)

router.get(
  '/tokens/balances/start',
  _(() => blockchainReader.startTokensTransfers())
)

router.get(
  '/tokens/transfers/stop',
  _(() => blockchainReader.stopTokensTransfers())
)

router.get(
  '/tokens/balances/stop',
  _(() => blockchainReader.stopTokensBalances())
)

module.exports = router
