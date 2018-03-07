require('app-module-path').addPath(__dirname)
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {models, initContext} = require('stox-bc-wallet-common')
const config = require('config')
const requireAll = require('require-all')
const path = require('path')

const jobs = requireAll(path.resolve(__dirname, 'jobs'))

const {databaseUrl, mqConnectionUrl} = config

const builderFunc = (builder) => {
  builder.db(databaseUrl, models)
  builder.addJobs(jobs)
  builder.addQueues(mqConnectionUrl)
}

createService('wallets-sync', builderFunc)
  .then(context => initContext({...context, config}))
  .catch(e => logger.error(e))
