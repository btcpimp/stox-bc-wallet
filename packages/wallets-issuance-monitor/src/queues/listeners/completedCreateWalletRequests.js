const {
  context,
  services: {wallets, tokensBalances, tokensTransfers, pendingRequests},
} = require('stox-bc-wallet-common')

module.exports = async ({body: completedRequest}) => {
  await pendingRequests.finishPendingRequest(completedRequest.id)
  const completedTransaction = completedRequest.transactions[0]
  const wallet =
      completedTransaction && completedTransaction.receipt ? completedTransaction.receipt.contractAddress : undefined
  if (!wallet || completedRequest.error) {
    context.logger.error({requestId: completedRequest.id}, 'ERROR_CREATE_WALLET')
  } else {
    await wallets.createWallet(wallet)

    const tokenBalances = (await wallets.getWalletBalanceInBlockchain(wallet)).filter(({balance}) => balance)
    await Promise.all(tokenBalances.map(async ({token, balance}) => {
      if (balance > 0) {
        await tokensBalances.updateBalance(token, wallet, balance)
        const transaction = {amount: balance, to: wallet}
        await tokensTransfers.sendTransactionsToBackend(token, wallet, [transaction], balance, new Date())
      }
    }))
  }
}
