require('app-module-path').addPath(__dirname)
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
// eslint-disable-next-line import/no-extraneous-dependencies
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
  .then((service) => {
    initContext({...service.context, config})
    return service.start()
  })
  .catch(e => logger.error(e))
