const requireAll = require('require-all')
const path = require('path')
const models = require('./db/models')
const context = require('./context')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createServiceFromFileStructure, initContext} = require('stox-common')

const {NODE_ENV, AWS_REGION} = process.env

const utils = requireAll(path.resolve(__dirname, 'utils'))
const services = requireAll({
  dirname: path.resolve(__dirname, 'services'),
  filter: /(.*)\.js$/,
})
const contractsDir = path.resolve(__dirname, './services/blockchain/contracts')

const start = async (dirname, config) => {
  try {
    const ctx = await createServiceFromFileStructure(dirname, NODE_ENV, AWS_REGION)
    initContext({...ctx, config}, context)
    context.logger = ctx.logger
  } catch (e) {
    logger.error(e)
  }
}

module.exports = {
  start,
  initContext,
  models,
  contractsDir,
  context,
  services,
  utils,
}
