const Sequelize = require('sequelize')
const {Op} = Sequelize

module.exports = (db) => {
  return {
    getTokensByNetwork: async network => db.tokens.findAll({where: {network}})
  }
}