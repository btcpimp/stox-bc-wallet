require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const jobs = require('./src/jobs')
const {databaseUrl, mqConnectionUrl} = require('./src/config')
const consumerQueues = require('./src/queues/consumer')
const rpcQueues = require('./src/queues/rpc')
const models = require('../common/src/db/models')
const routes = require('./src/routes')

const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models)
  builder.api(routes)
  builder.addJobs(jobs)
  builder.addConsumerQueues(consumerQueues, mqConnectionUrl)
  builder.addRpcQueues(rpcQueues, mqConnectionUrl)
})

service.start()
  .catch(logger.error)
