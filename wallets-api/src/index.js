require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {databaseUrl, web3Url, maxBlockRead, requiredConfirmation} = require('./config')
const {models, init} = require('stox-bc-wallet-common')
const api = require('api')
const context = require('context')

const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models)
  builder.addApi(api)
})

service
  .start()
  .then(c => Object.assign(context, c))
  .then(() => init(context, web3Url, maxBlockRead, requiredConfirmation))
  .catch(e => logger.error(e))
