// eslint-disable-next-line import/no-unresolved
require('app-module-path').addPath(__dirname)

const express = require('express')
const compression = require('compression')
const expressStatusMonitor = require('express-status-monitor')
const {loggers: {logger, expressLogger}, expressHelpers: {errorHandler}} = require('@welldone-software/node-toolbelt')
const apiRouter = require('app/apiRouter')
const {PORT, DATABASE_URL} = require('app/config')
const eventsLog = require('app/services/eventsLog')
const {dbInit} = require('app/db')

const app = express()

app.use(compression())
app.use(expressLogger)
app.set('trust proxy', 'loopback')
app.disable('x-powered-by')
app.use('/api/v1', apiRouter)
app.use(expressStatusMonitor())
app.use(errorHandler)

dbInit(DATABASE_URL)
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info({binding: server.address()}, 'Server started')
      eventsLog.start()
    })
  })
  .catch((err) => logger.error(err))