const {db} = require('../context')
const {exceptions: {NotFoundError}} = require('@welldone-software/node-toolbelt')

const getPendingRequests = async (type) => {
  const pendingRequests = await db.pendingRequests.findOne({where: {type}})
  if (!pendingRequests) {
    throw new NotFoundError('pending requests not found', {type})
  }
  return pendingRequests
}

const addPendingRequests = async (type, count) => {
  const pendingRequests = await getPendingRequests(type)
  const newCount = pendingRequests.count + count
  await pendingRequests.updateAttributes({count: newCount})
  return newCount
}

module.exports = {getPendingRequests, addPendingRequests}
