require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {mqConnectionUrl, databaseUrl} = require('./config')
const models = require('common/src/db/models')
const jobs = require('./jobs')
const api = require('./api')
const queues = require('./queues/consumer')
const db = require('./db')

const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models, db)
  builder.api(api)
  builder.addJobs(jobs)
  builder.addQueues(mqConnectionUrl, {listeners: queues})
})

service
  .start()
  .catch(e => logger.error(e))
