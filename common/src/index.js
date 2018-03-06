const requireAll = require('require-all')
const path = require('path')
const models = require('./db/models')
const context = require('./context')

const utils = requireAll(path.resolve(__dirname, 'utils'))
const services = requireAll({
  dirname: path.resolve(__dirname, 'services'),
  filter: /(.*)\.js$/,
})
console.log({services, utils})
const contractsDir = path.resolve(__dirname, './services/blockchain/contracts')
const initContext = (ctx) => {
  Object.keys(ctx).forEach(prop => Object.assign(context[prop], ctx[prop]))
}

module.exports = {
  initContext,
  models,
  contractsDir,
  context,
  services,
  utils,
}
