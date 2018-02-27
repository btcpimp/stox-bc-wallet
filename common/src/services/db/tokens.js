const Sequelize = require('sequelize')
const {db} = require('stox-common')

const {Op} = Sequelize

const getTokensByNetwork = async network => db.tokens.findAll({where: {network: {[Op.eq]: network}}})

module.exports = {
  getTokensByNetwork,
}
