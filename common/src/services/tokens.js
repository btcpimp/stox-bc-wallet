const {db, config} = require('../context')

const getTokens = () => db.tokens.findAll({where: {network: config.network}})

module.exports = {
  getTokens,
}
