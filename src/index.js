
require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved

const express = require('express')
const compression = require('compression')
const bodyParser = require('body-parser')
const expressStatusMonitor = require('express-status-monitor')
const {
  loggers: {logger, expressLogger},
  expressHelpers: {errorHandler},
} = require('@welldone-software/node-toolbelt')
const apiRouter = require('app/apiRouter')
const {dbInit} = require('../common/db')
const {port, databaseUrl, tokenTransferCron} = require('app/config')

const {scheduleJob, cancelJob} = require('app/scheduleUtils')
const{tokensTransfersJob} = require('../common/services/tokensTransfers') 

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