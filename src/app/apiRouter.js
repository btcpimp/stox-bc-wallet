const {Router} = require('express')
const bodyParser = require('body-parser')
const {expressHelpers: {createApiEndpoint}} = require('@welldone-software/node-toolbelt')

const _ = createApiEndpoint
const router = new Router()

router.use(bodyParser.json())

module.exports = router
