const {port} = require('config')
const {services: {wallets, tokensBalances, blockchain, tokens, accounts}} = require('stox-bc-wallet-common')

module.exports = {
  port,
  version: 1,
  routes: (router, _) => {
    router.get(
      '/tokenAddress',
      _(({query: {token}}) => tokens.getTokenAddress(token))
    )
    router.get(
      '/getAccountBalanceInEther',
      _(({query: {accountAddress}}) => accounts.getAccountBalanceInEther(accountAddress))
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
      _(({query: {address}}) => blockchain.smartWallets.getWithdrawalAddress(address))
    )
    router.get(
      '/wallets/blockchainBalance',
      _(({query: {address}}) => wallets.getWalletBalanceInBlockchain(address))
    )
    router.get(
      '/abi/setWithdrawalAddress',
      _(({query: {walletAddress, userWithdrawalAddress}}) =>
        blockchain.smartWallets.encodeAbiForSetWithdrawalAddress(walletAddress, userWithdrawalAddress))
    )
    router.get(
      '/abi/withdraw',
      _(({query: {walletAddress, tokenAddress, amount, feeTokenAddress, fee}}) =>
        blockchain.smartWallets.encodeAbiForWithdraw(walletAddress, tokenAddress, amount, feeTokenAddress, fee))
    )
    router.get(
      '/abi/transferToBackup',
      _(({query: {walletAddress, tokenAddress, amount}}) =>
        blockchain.smartWallets.encodeAbiForTransferToBackup(walletAddress, tokenAddress, amount))
    )
    router.get(
      '/abi/createWallet',
      _(() =>
        blockchain.smartWallets.encodeAbiForCreateWallet())
    )
    router.get(
      '/abi/sendPrize',
      _(({query: {prizeReceiverAddress, tokenAddress, amount, prizeDistributorAddress}}) =>
        blockchain.smartWallets.encodeAbiForSendPrize(
          prizeReceiverAddress,
          tokenAddress,
          amount,
          prizeDistributorAddress,
        ))
    )
    router.get(
      '/abi/sendPrizeExternal',
      _(({query: {userStoxWalletAddress, tokenAddress, amount, prizeDistributorAddress}}) =>
        blockchain.smartWallets.encodeAbiForSendPrizeExternal(
          userStoxWalletAddress,
          tokenAddress,
          amount,
          prizeDistributorAddress,
        ))
    )
  },
}
