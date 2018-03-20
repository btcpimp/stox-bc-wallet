const {services, context: {mq}} = require('stox-bc-wallet-common')
const {network} = require('config')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')

const sendTransactionsToBackend = async (asset, address, transactions, balance, happenedAt) => {
    const message = {
      network,
      address,
      asset,
      balance,
      happenedAt,
      transactions,
    }
  
    try {
      mq.publish('blockchain-token-transfers', message)
  
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
  }

module.exports = async ({body: request}) => {
    if (request.error) {
        throw new UnexpectedError('Received request with error')
    }
        
    const {tokens, wallets, tokensBalances} = services

    // TODO: is this the right property?
    const wallet = equest.transcations[0].to
    await services.wallets.createWallet(wallet)
    const tokenBalances = (await wallets.getWalletBalanceInBlockchain(wallet))
        .filter(({balance}) => balance)
    await Promise.all(tokenBalances.map(({token, balance}) => {
        await tokensBalances.updateBalance(token, wallet, balance)
        // TODO: get all transactions?
        const transcation = {amount: balance, status: 'confirmed', type: 'deposit'}
        await sendTransactionsToBackend(token, wallet, [transcation], balance, new Date())
    }))
}
