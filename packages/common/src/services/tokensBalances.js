const {db, config} = require('../context')

const updateBalance = async (tokenId, walletId, balance) =>
  db.tokensBalances.upsert({walletId, tokenId, balance})

const getBalance = address =>
  db.tokensBalances.findAll({
    attributes: ['tokenId', 'balance'],
    where: {walletId: `${config.network}.${address}`},
  })

module.exports = {
  updateBalance,
  getBalance,
}
