require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {contractsDir, initContext} = require('stox-bc-wallet-common')
const config = require('config')
const requireAll = require('require-all')
const path = require('path')

const rpcListeners = requireAll(path.resolve(__dirname, 'queues/rpcListeners'))

const {mqConnectionUrl, web3Url} = config

const builderFunc = (builder) => {
  builder.blockchain(web3Url, contractsDir)
  builder.addQueues(mqConnectionUrl, {rpcListeners})
}

createService('wallet-abi', builderFunc)
  .then(context => initContext({...context, config}))
  .catch(e => logger.error(e))
