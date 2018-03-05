const Sequelize = require('sequelize')
const {db} = require('../../context')

const {Op} = Sequelize

const getWalletsByAddresses = (addresses) => db.sequelize.query(
  `select * from wallets where lower(address) similar to '%(${addresses})%'`,
  {type: Sequelize.QueryTypes.SELECT},
)

const getUnassignedWalletsCount = (network) =>
  db.wallets.count({
    where: {
      [Op.and]: [
        {assignedAt: {[Op.eq]: null}},
        {corruptedAt: {[Op.eq]: null}},
        {network: {[Op.eq]: network}},
      ],
    },
  })

module.exports = {
  getUnassignedWalletsCount,
  getWalletsByAddresses,
}
