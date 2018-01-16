const {Router} = require('express')
const bodyParser = require('body-parser')
const {expressHelpers: {createApiEndpoint}} = require('@welldone-software/node-toolbelt')
const wallets = require('app/services/wallets')

const _ = createApiEndpoint
const router = new Router()

router.use(bodyParser.json())

router.get(
  '/wallets/:userId',
  _(({params: {userId}}) => wallets.getWallet(userId))
)

router.post(
  '/wallets/create',
  _(() => wallets.createWallet())
)

router.post(
  '/wallets/assign',
  _(({body: {userId}}) => wallets.assignWallet(userId))
)

module.exports = router
