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
// service.start() // connect to db -> start the api server -> start queues -> start jobs