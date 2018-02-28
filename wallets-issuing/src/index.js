require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {port, databaseUrl} = require('./config')
const models = require('common/src/db/models')
const jobs = require('./jobs')

const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models)
  builder.addJobs(jobs)
})

service
  .start()
  .catch(console.error)
