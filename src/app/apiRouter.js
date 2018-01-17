const {Router} = require('express')
const bodyParser = require('body-parser')
const {expressHelpers: {createApiEndpoint}} = require('@welldone-software/node-toolbelt')
const wallets = require('app/services/wallets')

const _ = createApiEndpoint
const router = new Router()

router.use(bodyParser.json())

router.get(
  '/wallets/unassigned',
  _(() => wallets.getUnassignedWallet())
)

router.post(
  '/wallets/create',
  _(() => wallets.createWallet())
)

router.post(
  '/wallets/assign',
  _(({body: {address}}) => wallets.assignWallet(address))
)

module.exports = router
