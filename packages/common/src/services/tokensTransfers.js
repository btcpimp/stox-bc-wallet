const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const context = require('../context')
const {omit} = require('lodash')
const {http, errors: {logError}} = require('stox-common')

const {db, config, mq} = context

const requestByTransactionHash = async (transactionHash) => {
  try {
    context.logger.info(
      {
        url: config.requestManagerApiBaseUrl,
        to: `/requestsByTransactionHash/${transactionHash}`
      },
      'requestManagerApiBaseUrl'
    )
    return await http(config.requestManagerApiBaseUrl).get(`/requestsByTransactionHash/${transactionHash}`)
  }catch(e){
    //todo: handle case when the api is down
    throw e
  }

}
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

const sendTransactionsToBackend = async (asset, address, transactions, balance, happenedAt) => {
  const transactionsWithRequest = transactions.map(async ({transactionHash, from, to, amount}) => {
    const request = await requestByTransactionHash(transactionHash)
    const requestId = request ? request.id : null
    const type = request ? request.type : 'deposit'
    return {
      from,
      to,
      transactionHash,
      amount,
      requestId,
      type,
      status: 'confirmed',
    }
  })
  Promise.all(transactionsWithRequest).then(async transactions => {
    const message = {
      network: config.network,
      address,
      asset,
      balance,
      happenedAt,
      transactions,
    }

    try {
      // Removed until stox-server will support queues
      // mq.publish('blockchain-token-transfers', message)
      context.logger.info(
        {
          url: config.backendBaseUrl,
          to: '/wallet/transaction',
          message,
        },
        'backendBaseUrl'
      )
      await http(config.backendBaseUrl).post('/wallet/transaction/', message)

      const rest = omit(message, 'transactions')
      context.logger.info(
        {
          ...rest,
          transactions: transactions.length,
          hash: transactions.map(t => t.transactionHash),
        },
        'SEND_TRANSACTIONS'
      )
    } catch (e) {
      logError(e)
    }
  })

}

module.exports = {insertTransactions, sendTransactionsToBackend}
