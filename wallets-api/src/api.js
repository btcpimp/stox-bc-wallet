const {port} = require('config')
const {services: {wallets, tokensBalances, blockchain, tokens}} = require('stox-bc-wallet-common')

module.exports = {
  port,
  version: 1,
  routes: (router, _) => {
    router.get(
      '/tokenAddress',
      _(({query: {token}}) => tokens.getTokenAddress(token))
    )
    router.get(
      '/unassigned/count',
      _(() => wallets.getUnassignedWalletsCount())
    )
    router.get(
      '/balance',
      _(({query: {address}}) => tokensBalances.getBalance(address))
    )
    router.post(
      '/assign',
      _(({body: {address}}) => wallets.assignWallet(address))
    )
    router.post(
      '/create',
      _(({body: {address}}) => wallets.createWallet(address))
    )
    router.post(
      '/createWallets',
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
  },
}
