const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const {Op} = Sequelize

module.exports = (db) => ({
  insertTransactions: async (tokenId, transactions, currentBlockTime, network) => {
    const transaction = await db.sequelize.transaction()

    try {
      await Promise.all(transactions.map(async (t) => {
        const {
          amount,
          blockNumber,
          logIndex,
          from,
          to,
          transactionHash,
          event,
        } = t
        return db.tokensTransfers.create(
          {
            blockNumber: Number(blockNumber),
            logIndex,
            transactionHash,
            tokenId,
            network,
            currentBlockTime,
            fromAddress: from,
            toAddress: to,
            amount: Number(amount),
            rawData: event,
          },
          {transaction}
        )
      }))
      await transaction.commit()
    } catch (e) {
      transaction.rollback()
      throw new UnexpectedError(e)
    }
  }
})
