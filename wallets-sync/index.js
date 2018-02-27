

require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved

console.log('\n\nright module\n\n')
const express = require('express')
const compression = require('compression')
const bodyParser = require('body-parser')
const expressStatusMonitor = require('express-status-monitor')
const {
  loggers: {logger, expressLogger},
  expressHelpers: {errorHandler},
} = require('@welldone-software/node-toolbelt')
const apiRouter = require('app/apiRouter')
const {dbInit} = require('../wallet-common/src/db')
const {port, databaseUrl, tokenTransferCron} = require('app/config')

const {scheduleJob, cancelJob} = require('app/scheduleUtils')
const{tokensTransfersJob} = require('../wallet-common/src/services/tokensTransfers') 

const app = express()

app.use(bodyParser.json())
app.use(compression())
app.use(bodyParser.json())
app.use(expressLogger())
app.set('trust proxy', 'loopback')
app.disable('x-powered-by')
app.use('/api/v1', apiRouter)
app.use(expressStatusMonitor())
app.use(errorHandler)

dbInit(databaseUrl)
  .then(() => {
    const server = app.listen(port, async () => {
      logger.info({binding: server.address()}, 'http server started')
      scheduleJob('tokensTransfers', tokenTransferCron, tokensTransfersJob)
    })
  })
  .catch(err => logger.error(err))

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