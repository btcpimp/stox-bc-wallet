const models = require('./db/models')
const createDatabaseServices = require('./services/db')
const errorHandle = require('./utils/errorHandle')
const promise = require('./utils/promise')

module.exports = {
  models,
  createDatabaseServices,
  errorHandle,
  promise,
}
