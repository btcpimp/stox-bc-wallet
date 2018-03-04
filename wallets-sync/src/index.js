require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const path = require('path')
const {createService} = require('stox-common')
const {databaseUrl, mqConnectionUrl, web3Url} = require('config')
const {models} = require('stox-bc-wallet-common')
const jobs = require('jobs')
const api = require('api')
const context = require('context')
const rpcListeners = require('queues/rpcListeners')


const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models)
  builder.api(api)
  builder.addJobs(jobs)
  builder.blockchain(web3Url, path.resolve(__dirname, './blockchain/contracts'))
  builder.addQueues(mqConnectionUrl,{rpcListeners})
})

service
  .start()
  .then(c => Object.assign(context, c))
  .catch(e => logger.error(e))
