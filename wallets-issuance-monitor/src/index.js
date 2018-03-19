require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {contractsDir, models, initContext} = require('stox-bc-wallet-common')
const config = require('config')
const requireAll = require('require-all')
const path = require('path')

const jobs = requireAll(path.resolve(__dirname, 'jobs'))

const {databaseUrl, web3Url, mqConnectionUrl} = config

const builderFunc = (builder) => {
  builder.db(databaseUrl, models)
  builder.blockchain(web3Url, contractsDir)
  builder.addQueues(mqConnectionUrl)
  builder.addJobs(jobs)
}

createService('wallets-sync', builderFunc)
  .then(context => initContext({...context, config}))
  .catch(e => logger.error(e))
