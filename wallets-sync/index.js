require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

const {createService} = require('stox-common')
const jobs = require('./jobs')
const {databaseUrl, mqConnectionUrl} = require('./config')
const consumerQueues = require('./queues/consumer')
const rpcQueues = require('./queues/rpc')
const models = require('../common/db/models')
const routes = require('./routes')

const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models)
  builder.api(routes)
  builder.addJobs(jobs)
  builder.addConsumerQueues(consumerQueues, mqConnectionUrl)
  builder.addRpcQueues(rpcQueues, mqConnectionUrl)
})

service.start()
  .then(console.log)
  .catch(console.error)
