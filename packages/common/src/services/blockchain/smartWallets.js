const {validateAddress, etherToWei} = require('../../utils/blockchain')
const {blockchain, config} = require('../../context')
const solc = require('solc')
const {exceptions: {InvalidArgumentError}} = require('@welldone-software/node-toolbelt')

const getOperatorAccount = async wallet => (await wallet.methods.wallet().call()).operatorAccount

const encodeAbiForSetWithdrawalAddress = async (walletAddress, userWithdrawalAddress) => {
  validateAddress(walletAddress)
  validateAddress(userWithdrawalAddress)

  const wallet = blockchain.getSmartWalletContract(walletAddress)
  const fromAccount = await getOperatorAccount(wallet)
  const encodedAbi = wallet.methods.setUserWithdrawalAccount(userWithdrawalAddress).encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForWithdraw = async (walletAddress, tokenAddress, amount, feeTokenAddress, fee) => {
  validateAddress(walletAddress)
  validateAddress(tokenAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  if (fee < 0) {
    throw new InvalidArgumentError(`Fee must be greater or equal to 0. Fee is ${fee}`)
  } else if (fee > 0) {
    validateAddress(feeTokenAddress)
  }

  const wallet = blockchain.getSmartWalletContract(walletAddress)
  const fromAccount = await getOperatorAccount(wallet)
  const encodedAbi = wallet.methods.transferToUserWithdrawalAccount(
    tokenAddress,
    etherToWei(amount),
    feeTokenAddress,
    etherToWei(fee)
  ).encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForTransferToBackup = async (walletAddress, tokenAddress, amount) => {
  validateAddress(walletAddress)
  validateAddress(tokenAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  const wallet = blockchain.getSmartWalletContract(walletAddress)
  const fromAccount = await getOperatorAccount(wallet)
  const encodedAbi = wallet.methods.transferToBackupAccount(tokenAddress, etherToWei(amount)).encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForCreateWallet = async () => {
  const fromAccount = config.walletsCreatorAccount
  const bytecode =
    await solc.linkBytecode(blockchain.getSmartWalletContractBin(), {':SmartWalletLib': config.smartWalletLibAddress})
  const encodedAbi = blockchain.getSmartWalletContract()
    .deploy({
      data: bytecode,
      arguments: [config.smartWalletsBackupAccount, config.smartWalletsOperatorAccount, config.smartWalletsFeesAccount],
    })
    .encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForSendPrize = async (
  prizeReceiverAddress,
  tokenAddress,
  amount,
  prizeDistributorAddress = config.defaultPrizeAccount
) => {
  validateAddress(prizeReceiverAddress)
  validateAddress(tokenAddress)
  validateAddress(prizeDistributorAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  const token = await blockchain.getERC20TokenContract(tokenAddress)
  const encodedAbi = token.methods.transfer(prizeReceiverAddress, etherToWei(amount)).encodeABI()

  return {fromAccount: prizeDistributorAddress, encodedAbi}
}

const getWithdrawalAddress = async (walletAddress) => {
  validateAddress(walletAddress)

  const wallet = blockchain.getSmartWalletContract(walletAddress)
  return (await wallet.methods.wallet().call()).userWithdrawalAccount
}

const getAccountAddresses = walletAddress => {
  validateAddress(walletAddress)

  const wallet = blockchain.getSmartWalletContract(walletAddress)
  return wallet.methods.wallet().call()
}

module.exports = {
  encodeAbiForSetWithdrawalAddress,
  encodeAbiForWithdraw,
  encodeAbiForTransferToBackup,
  encodeAbiForCreateWallet,
  encodeAbiForSendPrize,
  getWithdrawalAddress,
  getAccountAddresses,
}
