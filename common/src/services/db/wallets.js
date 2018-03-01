const Sequelize = require('sequelize')
const {Op} = Sequelize

module.exports = (db) => ({
  getWalletsByAddresses: async (addresses) => db.sequelize.query(
    `select * from wallets where lower(address) similar to '%(${addresses})%'`,
    {type: Sequelize.QueryTypes.SELECT},
  )
})