require('app-module-path').addPath(__dirname)
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {contractsDir, models, initContext} = require('stox-bc-wallet-common')
const config = require('./config')
const api = require('./api')

const {databaseUrl, web3Url} = config

const builderFunc = (builder) => {
  builder.db(databaseUrl, models)
  builder.blockchain(web3Url, contractsDir)
  builder.addApi(api)
}

createService('wallets-sync', builderFunc)
  .then(context => initContext({...context, config}))
  .catch(e => logger.error(e))
