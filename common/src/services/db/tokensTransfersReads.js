const Sequelize = require('sequelize')
const {Op} = Sequelize

module.exports = ({db}) => ({
  fetchLastReadBlock: async (tokenId) => {
    const row = await db.tokensTransfersReads.findOne({
      attributes: ['lastReadBlockNumber'],
      where: {tokenId: {[Op.eq]: tokenId}},
    })
    return row ? Number(row.lastReadBlockNumber) : 0
  },

  updateLastReadBlock: async (tokenId, lastReadBlockNumber) =>
    db.tokensTransfersReads.upsert({tokenId, lastReadBlockNumber})
})
