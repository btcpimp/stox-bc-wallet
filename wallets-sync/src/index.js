require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {models} = require('common')
const {port, databaseUrl, web3Url, activemqUrl} = require('./config')
const path = require('path')
const contractsDir = path.resolve(__dirname, '../../common/src/services/blockchain/contracts')
const {createService, blockchain} = require('stox-common')
const routes = require('./routes')
const createWalletRequest = require('./queues/consumer/create-wallet-request')
const walletApi = require('./queues/rpc/wallet-ABI')
const walletsIssuing= require('./jobs/wallets-issuing')
const tokensTransfers = require('./jobs/tokens-transfers')


/* ========= Yair draft =============
require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
// const {createService} = require('stox-common')
const routes = require('./routes')
const jobs = require('./jobs')
const consumerQueues = require('./queues/consumer')
const rpcQueues = require('./queues/rpc')



// const service = createService('wallets-sync', builder => {
//   builder.addDb(databaseUrl, models)
//   builder.addApiServer(require('./routes'))
//   builder.addJobs(require('./jobs'))
//   builder.addConsumerQueues(require('./queues/consumer'))
//   builder.addRpcQueues(require('./queues/rpc'))
// })
//
// // http, scheduler, blockchain, mq, http server, db-connect
//
// service.start() // connect to db -> start the api server -> start queues -> start jobs */

const service = createService('wallets-manager', builder => {
  builder.api({
    port,
    version: 1,
    routes
  })

  builder.db(databaseUrl, models)

  // builder.addConsumerQueue(activemqUrl, 'wallets-manager/create-wallet-request', createWalletRequest)

  // builder.addRpcQueue('wallets-manager/wallet/ABI', walletApi)

  builder.addJob('tokens-transfers', tokensTransfers)

  // builder.addJob('wallets-issuing', walletsIssuing)
})

//TODO: add blockchain to builder in stox-common
blockchain.initBlockchain(web3Url, contractsDir).then(() => service.start())
