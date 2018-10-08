const {db} = require('../context')
const context = require('../context')
const {errors: {logError}} = require('stox-common')
const uuid = require('uuid')

const getCountByType = async type => db.pendingRequests.count({where: {type}})

const addPendingRequest = async (type) => {
  const requestId = uuid()
  context.logger.info({requestId}, 'NEW_PENDING_REQUEST_RECORD')
  const request = await db.pendingRequests.create({type, requestId})
  context.logger.info({newDbRequest: request.dataValues}, 'NEW_PENDING_REQUEST_RECORD')
  context.logger.info({newDbRequest: request}, 'NEW_PENDING_REQUEST_RECORD')
  return requestId
}

const finishPendingRequest = async (requestId) => {
  const destroyedCount = await db.pendingRequests.destroy({where: {requestId}})
  if (!destroyedCount) {
    logError({requestId}, 'PENDING_REQUEST_NOT_FOUND')
  }
}

module.exports = {getCountByType, addPendingRequest, finishPendingRequest}
