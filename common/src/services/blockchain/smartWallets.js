const {validateAddress, etherToWei} = require('../../utils/blockchain')
const {blockchain} = require('../../context')
const {exceptions: {InvalidArgumentError}} = require('@welldone-software/node-toolbelt')

const encodeAbiForSetWithdrawalAddress = (userWithdrawalAddress) => {
  validateAddress(userWithdrawalAddress)
  const wallet = blockchain.getSmartWalletContract()
  return wallet.methods.setUserWithdrawalAccount(userWithdrawalAddress).encodeABI()
}

const encodeAbiForWithdraw = (tokenAddress, amount, feeTokenAddress, fee) => {
  validateAddress(tokenAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  if (fee < 0) {
    throw new InvalidArgumentError(`Fee must be greater or equal to 0. Fee is ${fee}`)
  } else if (fee > 0) {
    validateAddress(feeTokenAddress)
  }

  const wallet = blockchain.getSmartWalletContract()
  return wallet.methods.transferToUserWithdrawalAccount(
    tokenAddress,
    etherToWei(amount),
    feeTokenAddress,
    etherToWei(fee)
  ).encodeABI()
}

const encodeAbiForTransferToBackup = (tokenAddress, amount) => {
  validateAddress(tokenAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  const wallet = blockchain.getSmartWalletContract()
  return wallet.methods.transferToBackupAccount(tokenAddress, etherToWei(amount)).encodeABI()
}

module.exports = {
  encodeAbiForSetWithdrawalAddress,
  encodeAbiForWithdraw,
  encodeAbiForTransferToBackup,
}
