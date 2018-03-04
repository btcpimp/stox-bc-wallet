require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {mqConnectionUrl, databaseUrl} = require('./config')
const {models} = require('stox-bc-wallet-common')
const jobs = require('jobs')
const api = require('api')
const context = require('context')

const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models)
  builder.api(api)
  builder.addJobs(jobs)
  builder.addQueues(mqConnectionUrl)
})

service
  .start()
  .then(c => Object.assign(context, c))
  .catch(e => logger.error(e))
