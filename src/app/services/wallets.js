const {exceptions: {NotFoundError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const db = require('app/db')
const {getSmartWalletContract} = require('./blockchain')

const {Op} = Sequelize

const {
  validateAddress,
  isAddressEmpty,
} = require('app/utils')

const createWallet = async () => db.wallet.create({
  address: new Date().getTime(),
  assignedAt: null,
})

const assignWallet = async () => {
  const wallet = await db.wallets.findOne({where: {assignedAt: {[Op.eq]: null}}})

  if (!wallet) {
    throw new NotFoundError('no wallets to assign')
  }

  wallet.update({assignedAt: new Date()})

  return wallet.address
}

const getWallet = async (walletAddress) => {
  validateAddress(walletAddress)
  const walletContract = getSmartWalletContract(walletAddress)
  const {operatorAccount, backupAccount, feesAccount, userWithdrawalAccount} =
    await walletContract.methods.wallet().call()

  return {walletAddress, operatorAccount, backupAccount, feesAccount, userWithdrawalAccount}
}

const isWithdrawAddressSet = async (walletAddress) => {
  validateAddress(walletAddress)
  const isSet = !isAddressEmpty((await getWallet(walletAddress)).userWithdrawalAccount)

  return {isSet}
}

module.exports = {
  createWallet,
  assignWallet,
  isWithdrawAddressSet,
}
