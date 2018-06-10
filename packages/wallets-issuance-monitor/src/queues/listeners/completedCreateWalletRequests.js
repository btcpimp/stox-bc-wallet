const {
  context,
  services: {wallets, tokensBalances, tokensTransfers, pendingRequests},
} = require('stox-bc-wallet-common')

module.exports = async ({body: completedRequest}) => {
  const dbTransaction = await context.db.sequelize.transaction()
  try {
    await pendingRequests.destroyPendingRequest(completedRequest.id, dbTransaction)
    const completedTransaction = completedRequest.transactions[0]
    const wallet =
      completedTransaction && completedTransaction.receipt ? completedTransaction.receipt.contractAddress : undefined
    if (!wallet || completedRequest.error) {
      throw completedRequest.error
    } else {
      await wallets.createWallet(wallet, dbTransaction)

      const tokenBalances = (await wallets.getWalletBalanceInBlockchain(wallet)).filter(({balance}) => balance)
      await Promise.all(tokenBalances.map(async ({token, balance}) => {
        if (balance > 0) {
          await tokensBalances.updateBalance(token, wallet, balance)
          const transaction = {amount: balance, to: wallet}
          await tokensTransfers.sendTransactionsToBackend(token, wallet, [transaction], balance, new Date())
        }
      }))
    }
  } catch (e) {
    context.logger.error({...e, requestId: completedRequest.id}, 'ERROR_CREATE_WALLET')
  }
  await dbTransaction.commit()
}
