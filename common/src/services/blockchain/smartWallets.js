const {validateAddress, etherToWei} = require('../../utils/blockchain')
const {blockchain} = require('../../context')
const {exceptions: {InvalidArgumentError}} = require('@welldone-software/node-toolbelt')

const encodeAbiForSetWithdrawalAddress = async (walletAddress, userWithdrawalAddress) => {
  validateAddress(userWithdrawalAddress)
  const wallet = blockchain.getSmartWalletContract(walletAddress)
  const fromAccount = (await wallet.methods.wallet().call()).operatorAccount
  const encodedAbi = wallet.methods.setUserWithdrawalAccount(userWithdrawalAddress).encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForWithdraw = async (walletAddress, tokenAddress, amount, feeTokenAddress, fee) => {
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
  const fromAccount = (await wallet.methods.wallet().call()).operatorAccount
  const encodedAbi = wallet.methods.transferToUserWithdrawalAccount(
    tokenAddress,
    etherToWei(amount),
    feeTokenAddress,
    etherToWei(fee)
  ).encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForTransferToBackup = async (walletAddress, tokenAddress, amount) => {
  validateAddress(tokenAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  const wallet = blockchain.getSmartWalletContract(walletAddress)
  const fromAccount = (await wallet.methods.wallet().call()).operatorAccount
  const encodedAbi = wallet.methods.transferToBackupAccount(tokenAddress, etherToWei(amount)).encodeABI()

  return {fromAccount, encodedAbi}
}

module.exports = {
  encodeAbiForSetWithdrawalAddress,
  encodeAbiForWithdraw,
  encodeAbiForTransferToBackup,
}
