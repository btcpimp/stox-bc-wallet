const Sequelize = require('sequelize')
const {db} = require('stox-common')

const getWalletsByAddresses = async (addresses) => db.sequelize.query(
  `select * from wallets where lower(address) similar to '%(${addresses})%'`,
  {type: Sequelize.QueryTypes.SELECT},
)

module.exports = {
  getWalletsFromTransactions,
}
