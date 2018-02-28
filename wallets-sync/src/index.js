require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-common')
const {port, databaseUrl} = require('./config')
const models = require('../../common/src/db/models')
const jobs = require('./jobs')
const routes = require('./routes')

console.log({port, databaseUrl})

const service = createService('wallets-sync', (builder) => {
  builder.db(databaseUrl, models)
  builder.api(routes)
  builder.addJobs(jobs)
})

service
  .start()
  .catch(console.error)


// const createWalletRequest = require('./queues/consumer/create-wallet-request')
// const walletApi = require('./queues/rpc/wallet-ABI')
// const walletsIssuing= require('./jobs/wallets-issuing')
// const tokensTransfers = require('./jobs/tokens-transfers')

// const service = createService('wallets-manager', builder => {
//   builder.api({
//     port,
//     version: 1,
//     routes
//   })
//   // builder.addConsumerQueue(activemqUrl, 'wallets-manager/create-wallet-request', createWalletRequest)
//   // builder.addRpcQueue('wallets-manager/wallet/ABI', walletApi)
//   // builder.addJob('wallets-issuing', walletsIssuing)
// })

//TODO: add blockchain to builder in stox-common
// const contractsDir = path.resolve(__dirname, '../../common/src/services/blockchain/contracts')
// blockchain.initBlockchain(web3Url, contractsDir).then(() => service.start())
