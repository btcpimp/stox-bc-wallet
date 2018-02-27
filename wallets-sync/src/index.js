require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createServer} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {initRoutes} = require('app/apiRouter')
const models = require('common/src/db/models')
const {port, databaseUrl, tokenTransferCron} = require('./config')
const tokensTransfers = require('./jobs/tokens-transfers')
const {schedule: {scheduleJob}} = require('stox-common')

scheduleJob('tokensTransfers', tokensTransfers.cron, tokensTransfers.job)

// const app = express()
//
// app.use(bodyParser.json())
// app.use(compression())
// app.use(bodyParser.json())
// app.use(expressLogger())
// app.set('trust proxy', 'loopback')
// app.disable('x-powered-by')
// app.use('/api/v1', apiRouter)
// app.use(expressStatusMonitor())
// app.use(errorHandler)
//
// dbInit(databaseUrl)
//   .then(() => {
//     const server = app.listen(port, async () => {
//       logger.info({binding: server.address()}, 'http server started')
//       scheduleJob('tokensTransfers', tokenTransferCron, tokensTransfersJob)
//     })
//   })
//   .catch(err => logger.error(err))

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