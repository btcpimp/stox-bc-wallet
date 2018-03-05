const Sequelize = require('sequelize')
const {Op} = Sequelize

module.exports = ({db}) => ({
  getWalletsByAddresses: async (addresses) => db.sequelize.query(
    `select * from wallets where lower(address) similar to '%(${addresses})%'`,
    {type: Sequelize.QueryTypes.SELECT},
  ),

  getUnassignedWalletsCount: async (network) => {
    const count = await db.wallets.count({
      where: {
        [Op.and]: [
          {assignedAt: {[Op.eq]: null}},
          {corruptedAt: {[Op.eq]: null}},
          {network: {[Op.eq]: network}},
        ],
      },
    })
    return {count}
  }

})
