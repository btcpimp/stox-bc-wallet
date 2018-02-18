const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')

const updateBalance = async (tokenId, walletId, balance) => {
  const transaction = await db.sequelize.transaction()

  try {
    const tokenBalance = await db.tokensBalances.findOne({
      where: {
        walletId,
        tokenId,
      },
      transaction,
      lock: Sequelize.Transaction.LOCK.UPDATE,
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


module.exports = {
  updateBalance,
}
