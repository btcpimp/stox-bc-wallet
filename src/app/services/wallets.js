const {loggers: {logger}, exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const db = require('app/db')
const {getSmartWalletContract} = require('./blockchain')
const {maxWalletAssignRetires, network} = require('app/config')
const {validateAddress, isAddressEmpty} = require('app/utils')

const {Op} = Sequelize

const getWallet = async (walletAddress) => {
  validateAddress(walletAddress)
  const walletContract = getSmartWalletContract(walletAddress.toLowerCase())
  const {operatorAccount, backupAccount, feesAccount, userWithdrawalAccount} =
    await walletContract.methods.wallet().call()

  return {walletAddress, operatorAccount, backupAccount, feesAccount, userWithdrawalAccount}
}

const isWithdrawAddressSet = async (walletAddress) => {
  validateAddress(walletAddress)
  return !isAddressEmpty((await getWallet(walletAddress.toLowerCase())).userWithdrawalAccount)
}

const tryAssignWallet = async () => {
  const wallet = await db.wallets.findOne({
    where: {
      [Op.and]: [
        {assignedAt: {[Op.eq]: null}},
        {setWithdrawAddressAt: {[Op.eq]: null}},
        {corruptedAt: {[Op.eq]: null}},
        {network: {[Op.eq]: network}},
      ],
    },
  })

  if (!wallet) {
    throw new UnexpectedError('wallets pool is empty')
  }

  await wallet.update({assignedAt: new Date()}, {where: {assignedAt: {[Op.eq]: null}}})

  return wallet
}


const assignWallet = async (withdrawAddress, times = 1) => {
  validateAddress(withdrawAddress)
  if (times >= maxWalletAssignRetires) {
    throw new Error('too many tries')
  }

  const wallet = await tryAssignWallet()

  if (!wallet) {
    throw new UnexpectedError('wallets pool is empty')
  }

  try {
    // todo: validate withdraw address
    // if (await isWithdrawAddressSet(wallet.address)) {
    //   await wallet.updateAttributes({corruptedAt: new Date()})
    //   logger.info({wallet}, 'CORRUPTED')
    //
    //   return assignWallet(withdrawAddress.toLowerCase(), ++times)
    // }

    // todo: set withdraw address
    // if (await setWithdrawAddress(wallet.address, withdrawAddress.toLowerCase())) {
    //   await wallet.updateAttributes({setWithdrawAddressAt: new Date()})
    //   logger.info({wallet}, 'SET_WITHDRAW_ADDRESSAT')
    // }

    logger.info({wallet}, 'ASSIGNED')
    return wallet
  } catch (e) {
    logger.error(e)
    return assignWallet(network, withdrawAddress, ++times)
  }
}

const getWalletBalance = async (walletAddress) => {
  validateAddress(walletAddress)
  // todo: implement case sensitive query
  db.tokensBalances.findAll({
    attributes: ['tokenId', 'balance'],
    where: {walletId: {[Op.eq]: `${network}.${walletAddress}`}},
  })
}

const getUnassignedWalletsCount = async () => {
  const count = await db.wallets.count({
    where: {
      [Op.and]: [
        {assignedAt: {[Op.eq]: null}},
        {setWithdrawAddressAt: {[Op.eq]: null}},
        {corruptedAt: {[Op.eq]: null}},
        {network: {[Op.eq]: network}},
      ],
    },
  })
  return {count}
}

const createWallets = async addresses => db.sequelize.transaction().then(async (transaction) => {
  try {
    const promises = addresses.map(async address => db.wallets.create(
      {
        id: `${network}.${address}`,
        address,
        network,
        version: 1,
      },
      {transaction}
    ))

    await Promise.all(promises)
    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
  }
})

const createWallet = async address => createWallets([address])

module.exports = {
  assignWallet,
  getWalletBalance,
  createWallet,
  createWallets,
  getUnassignedWalletsCount,
}
