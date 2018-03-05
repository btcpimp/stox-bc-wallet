const {db} = require('../../context')

const getTokensByNetwork = network => db.tokens.findAll({where: {network}})

module.exports = {
    getTokensByNetwork,
}
