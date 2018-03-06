const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {db, config} = require('../../context')

const insertTransactions = async (tokenId, transactions, currentBlockTime) => {
  const transaction = await db.sequelize.transaction()

  try {
    await Promise.all(transactions.map((t) => {
      const {amount, blockNumber, logIndex, from, to, transactionHash, event} = t
      return db.tokensTransfers.create(
        {
          blockNumber: Number(blockNumber),
          logIndex,
          transactionHash,
          tokenId,
          network: config.network,
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
module.exports = {insertTransactions}
