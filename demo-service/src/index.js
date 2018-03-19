require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {models, contractsDir, initContext} = require('stox-bc-wallet-common')
const config = require('config')
const requireAll = require('require-all')
const path = require('path')

const {databaseUrl, mqConnectionUrl, web3Url} = config
const jobs = requireAll(path.resolve(__dirname, 'jobs'))
const listeners = requireAll(path.resolve(__dirname, 'queues/listeners'))
const rpcListeners = requireAll(path.resolve(__dirname, 'queues/rpcListeners'))

const builderFunc = (builder) => {
  builder.db(databaseUrl, models)
  builder.blockchain(web3Url, contractsDir)
  builder.addJobs(jobs)
  builder.addQueues(mqConnectionUrl, {listeners, rpcListeners})
}

const start = async () => {
  try {
    const context = await createService('demo-service', builderFunc)
    initContext({...context, config})
  } catch (e) {
    logger.error(e)
  }
}

start()
