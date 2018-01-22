require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved

const express = require('express')
const compression = require('compression')
const lusca = require('lusca')
const cors = require('cors')
const bodyParser = require('body-parser')
const expressStatusMonitor = require('express-status-monitor')
const {
  loggers: {logger, expressLogger},
  expressHelpers: {errorHandler},
} = require('@welldone-software/node-toolbelt')
const apiRouter = require('app/apiRouter')
const {dbInit} = require('app/db')
const {port, databaseUrl} = require('app/config')
const transactionLog = require('app/services/transactionLog')

const app = express()

app.use(bodyParser.json())
app.use(cors({credentials: true, origin: true}))
app.use(compression())
app.use(bodyParser.json())
app.use(expressLogger())
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))
app.set('trust proxy', 'loopback')
app.disable('x-powered-by')
app.use('/api/v1', apiRouter)
app.use(expressStatusMonitor())
app.use(errorHandler)

dbInit(databaseUrl)
  .then(() => {
    const server = app.listen(port, () => {
      logger.info({binding: server.address()}, 'Server started')
      transactionLog.start()
    })
  })
  .catch((err) => logger.error(err))