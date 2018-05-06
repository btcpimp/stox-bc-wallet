const {
  context,
  services: {wallets, tokensBalances, tokensTransfers, pendingRequests},
} = require('stox-bc-wallet-common')

module.exports = async ({body: completedRequest}) => {
  await pendingRequests.addPendingRequests('createWallet', -1)

  const wallet =
    completedRequest.transactions[0].receipt ? JSON.parse(completedRequest.transactions[0].receipt).contractAddress :
      undefined
  if (wallet) {
    await wallets.createWallet(wallet)
    const tokenBalances = (await wallets.getWalletBalanceInBlockchain(wallet)).filter(({balance}) => balance)

    await Promise.all(tokenBalances.map(async ({token, balance}) => {
      if (balance > 0) {
        await tokensBalances.updateBalance(token, wallet, balance)
        const transaction = {amount: balance, to: wallet}
        await tokensTransfers.sendTransactionsToBackend(token, wallet, [transaction], balance, new Date())
      }
    }))
  } else {
    context.logger.error(completedRequest, 'ERROR_CREATE_WALLET')
  }
}
