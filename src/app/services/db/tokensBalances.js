const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')

const {Op} = Sequelize

const updateBalance = async (tokenId, walletId, balance) =>
  db.sequelize.transaction()
    .then(async (transaction) => {
      try {
        const tokenBalance = await db.tokensBalances.findOne({
          where: {
            [Op.and]: [
              {walletId: {[Op.eq]: walletId}},
              {tokenId: {[Op.eq]: tokenId}},
            ],
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
    })

module.exports = {
  updateBalance,
}
