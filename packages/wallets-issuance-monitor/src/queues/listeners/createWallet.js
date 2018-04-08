const {services: {wallets, tokensBalances, tokensTransfers, pendingRequests}} = require('stox-bc-wallet-common')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')

module.exports = async ({body: request}) => {
  if (request.error) {
    throw new UnexpectedError('Received request with error')
  }

  const wallet = request.transcations[0].to
  await wallets.createWallet(wallet)
  await pendingRequests.addPendingRequests('createWallet', -1)
  const tokenBalances = (await wallets.getWalletBalanceInBlockchain(wallet)).filter(({balance}) => balance)

  await Promise.all(tokenBalances.map(async ({token, balance}) => {
    if (balance > 0) {
      await tokensBalances.updateBalance(token, wallet, balance)
      const transcation = {amount: balance, to: wallet}
      await tokensTransfers.sendTransactionsToBackend(token, wallet, [transcation], balance, new Date())
    }
  }))
}
