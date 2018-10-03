const {db} = require('../context')
const {errors: {logError}} = require('stox-common')

const getCountByType = async type => db.pendingRequests.count({where: {type}})

const addPendingRequest = async (type, requestId, dbTransaction) =>
  db.pendingRequests.create({type, requestId}, {transaction: dbTransaction})

const finishPendingRequest = async (requestId, dbTransaction) => {
  const destroyedCount = await db.pendingRequests.destroy({where: {requestId}, transaction: dbTransaction})
  if (!destroyedCount) {
    logError({requestId}, 'PENDING_REQUEST_NOT_FOUND')
  }
}

module.exports = {getCountByType, addPendingRequest, finishPendingRequest}
