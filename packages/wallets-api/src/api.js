const {port} = require('config')
const {
  services: {
    accounts, wallets, tokensBalances, blockchain: {smartWallets, tokenTracker}, tokens
  },
} = require('stox-bc-wallet-common')

module.exports = {
  port,
  version: 1,
  routes: (router, _) => {
    router.get(
      '/tokenAddress',
      _(({query: {token}}) => tokens.getTokenAddress(token))
    )
    router.get(
      '/wallets/unassigned/count',
      _(() => wallets.getUnassignedWalletsCount())
    )
    router.get(
      '/wallets/balance',
      _(({query: {address}}) => tokensBalances.getBalance(address))
    )
    router.post(
      '/wallets/assign',
      _(({body: {withdrawAddress}}) => wallets.assignWallet(withdrawAddress))
    )
    router.post(
      '/wallets/create',
      _(({body: {address}}) => wallets.createWallet(address))
    )
    router.post(
      '/wallets/createWallets',
      _(({body: {addresses}}) => wallets.createWallets(addresses))
    )
    router.get(
      '/wallets/withdrawalAddress',
      _(({query: {address}}) => smartWallets.getWithdrawalAddress(address))
    )
    router.get(
      '/wallets/blockchainBalance',
      _(({query: {address}}) => wallets.getWalletBalanceInBlockchain(address))
    )
    router.get(
      '/abi/setWithdrawalAddress',
      _(({query: {walletAddress, userWithdrawalAddress}}) =>
        smartWallets.encodeAbiForSetWithdrawalAddress(walletAddress, userWithdrawalAddress))
    )
    router.get(
      '/abi/withdraw',
      _(({query: {walletAddress, tokenAddress, amount, feeTokenAddress, fee}}) =>
        smartWallets.encodeAbiForWithdraw(walletAddress, tokenAddress, amount, feeTokenAddress, fee))
    )
    router.get(
      '/abi/transferToBackup',
      _(({query: {walletAddress, tokenAddress, amount}}) =>
        smartWallets.encodeAbiForTransferToBackup(walletAddress, tokenAddress, amount))
    )
    router.get(
      '/abi/createWallet',
      _(() =>
        smartWallets.encodeAbiForCreateWallet())
    )
    router.get(
      '/abi/sendPrize',
      _(({query: {prizeReceiverAddress, tokenAddress, amount, prizeDistributorAddress}}) =>
        smartWallets.encodeAbiForSendPrize(
          prizeReceiverAddress,
          tokenAddress,
          amount,
          prizeDistributorAddress,
        ))
    )
    router.get(
      '/abi/sendPrizeExternal',
      _(({query: {userStoxWalletAddress, tokenAddress, amount, prizeDistributorAddress}}) =>
        smartWallets.encodeAbiForSendPrizeExternal(
          userStoxWalletAddress,
          tokenAddress,
          amount,
          prizeDistributorAddress,
        ))
    )
    router.post(
      '/estimateTokenTransfer',
      _(({body: {tokenAddresses, from, priority}}) =>
        tokenTracker.estimateTokenTransfer({tokenAddresses, from, priority}))
    )
    router.post(
      '/accountBalance',
      _(({body: {accountAddress, tokenAddresses}}) =>
        accounts.getAccountBalance({accountAddress, tokenAddresses}))
    )
  },
}
