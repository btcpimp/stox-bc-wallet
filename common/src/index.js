const models = require('./db/models')
const createDatabaseServices = require('./services/db')
const errorHandle = require('./utils/errorHandle')
const promise = require('./utils/promise')
const blockchainUtils = require('./utils/blockchainUtils')
const blockchain = require('./services/blockchain')
const contextObject = require('./context')

/**
 * init stox-bc-wallet-common
 * @param {{db: Object}} context
 * @param {string} [web3Url]
 * @param {number} [maxBlocksRead]
 * @param {number} [requiredConfirmations]
 */
const init = (context, web3Url, maxBlocksRead, requiredConfirmations) => {
  Object.assign(contextObject.db, context.db)
  blockchainUtils.initBlockchain(web3Url, maxBlocksRead, requiredConfirmations)
}

module.exports = {
  models,
  createDatabaseServices,
  errorHandle,
  promise,
  blockchainUtils,
  blockchain,
  init,
}
