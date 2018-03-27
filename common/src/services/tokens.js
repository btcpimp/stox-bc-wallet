const {db, config} = require('../context')
const {exceptions: {NotFoundError}} = require('@welldone-software/node-toolbelt')
const getTokens = () => db.tokens.findAll({where: {network: config.network}})
const getTokenAddress = async (tokenId) =>  {
  const token = await db.tokens.findOne({where: {network: config.network, name: tokenId}})
  if (!token) {
    throw new NotFoundError('Token not found', {token})
  }
  return token.address
}

module.exports = {getTokens, getTokenAddress}
