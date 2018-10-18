const {db} = require('../context')
const {errors: {logError}} = require('stox-common')
const uuid = require('uuid')

const getCountByType = async type => db.pendingRequests.count({where: {type}})

const addPendingRequest = async (type) => {
  const requestId = uuid()
  await db.pendingRequests.create({type, requestId})
  return requestId
}

const finishPendingRequest = async (requestId) => {
  const destroyedCount = await db.pendingRequests.destroy({where: {requestId}})
  if (!destroyedCount) {
    logError({requestId}, 'PENDING_REQUEST_NOT_FOUND')
  }
}

module.exports = {getCountByType, addPendingRequest, finishPendingRequest}
