const Sequelize = require('sequelize')
const {db} = require('stox-common')

const {Op} = Sequelize

const fetchLastReadBlock = async (tokenId) => {
  const row = await db.tokensTransfersReads.findOne({
    attributes: ['lastReadBlockNumber'],
    where: {tokenId: {[Op.eq]: tokenId}},
  })
  return row ? Number(row.lastReadBlockNumber) : 0
}

const updateLastReadBlock = async (tokenId, lastReadBlockNumber) =>
  db.tokensTransfersReads.upsert({tokenId, lastReadBlockNumber})

module.exports = {
  fetchLastReadBlock,
  updateLastReadBlock,
}
