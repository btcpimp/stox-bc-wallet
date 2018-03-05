require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {databaseUrl, mqConnectionUrl, web3Url, maxBlockRead, requiredConfirmation} = require('./config')
const {models, init} = require('stox-bc-wallet-common')
const jobs = require('jobs')
const context = require('context')
const rpcListeners = require('queues/rpcListeners')

const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models)
  builder.addJobs(jobs)
  builder.addQueues(mqConnectionUrl, {rpcListeners})
})

service.start()
  .then(c => Object.assign(context, c))
  .then(() => init(context, web3Url, maxBlockRead, requiredConfirmation))
  .catch(e => logger.error(e))
