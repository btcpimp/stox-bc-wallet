const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const {db, config} = require('../../context')
const {Op} = Sequelize

const updateBalance = async (tokenId, walletId, balance) => {
  const transaction = await db.sequelize.transaction()

  try {
    const tokenBalance = await db.tokensBalances.findOne({
      where: {
        walletId,
        tokenId,
      },
      transaction,
    })

    if (!tokenBalance) {
      await db.tokensBalances.create(
        {
          walletId,
          tokenId,
          balance,
          pendingUpdateBalance: 0,
        },
        {transaction}
      )
    } else {
      await tokenBalance.update({balance, pendingUpdateBalance: 0}, {
        where: {
          walletId,
          tokenId,
        },
      }, {transaction})
    }
    transaction.commit()
  } catch (e) {
    transaction.rollback()
    throw new UnexpectedError(e)
  }
}

const getBalance = async (address) => db.tokensBalances.findAll({
  attributes: ['tokenId', 'balance'],
  where: {walletId: {[Op.eq]: `${config.network}.${address}`}}
})

module.exports = {
  updateBalance,
  getBalance
}
