const path = require('path')
const models = require('./db/models')
const services = require('./services')
const utils = require('./utils')
const context = require('./context')

const contractsDir = path.resolve(__dirname, './services/blockchain/contracts')
const initContext = (ctx) => {
  for(var prop in ctx) {
    Object.assign(context[prop], ctx[prop])
  }
}

module.exports = {
  initContext,
  models,
  contractsDir,
  context,
  services,
  utils,
}
