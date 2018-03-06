const {loggers: {logger}, exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const context = require('context')
const {maxWalletAssignRetires, network} = require('config')
const {
  blockchainUtils: {validateAddress, isAddressEmpty},
  blockchain,
} = require('stox-bc-wallet-common')

const {Op} = Sequelize

const getWallet = async (walletAddress) => {
  validateAddress(walletAddress)
  const walletContract = blockchain.getSmartWalletContract(walletAddress.toLowerCase())
  const {operatorAccount, backupAccount, feesAccount, userWithdrawalAccount} =
    await walletContract.methods.wallet().call()

  return {walletAddress, operatorAccount, backupAccount, feesAccount, userWithdrawalAccount}
}

const isWithdrawAddressSet = async (walletAddress) => {
  validateAddress(walletAddress)
  return !isAddressEmpty((await getWallet(walletAddress.toLowerCase())).userWithdrawalAccount)
}

const tryAssignWallet = async () => {
  const transaction = await context.db.sequelize.transaction()
  try {
    const wallet = await context.db.wallets.findOne({
      where: {
        [Op.and]: [
          {assignedAt: {[Op.eq]: null}},
          {corruptedAt: {[Op.eq]: null}},
          {network: {[Op.eq]: network}},
        ],
      },
      lock: Sequelize.Transaction.LOCK.UPDATE,
      transaction,
    })

    if (!wallet) {
      throw new UnexpectedError('wallets pool is empty')
    }

    await wallet.updateAttributes({assignedAt: new Date()}, {transaction})
    await transaction.commit()

    return wallet
  } catch (e) {
    transaction.rollback()
    throw e
  }
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

    logger.info(wallet, 'ASSIGNED')
    return wallet
  } catch (e) {
    logger.error(e)
    return assignWallet(network, withdrawAddress, ++times)
  }
}

const getWalletBalance = async (walletAddress) => {
  validateAddress(walletAddress)
  // todo: implement case sensitive query
  context.db.tokensBalances.findAll({
    attributes: ['tokenId', 'balance'],
    where: {walletId: {[Op.eq]: `${network}.${walletAddress}`}},
  })
}

const createWallets = async (addresses) => {
  const transaction = await context.db.sequelize.transaction()
  try {
    await Promise.all(addresses.map(address => context.db.wallets.create(
      {
        id: `${network}.${address}`,
        address,
        network,
        version: 1,
      },
      {transaction}
    )))

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
  }
}

const createWallet = async address => createWallets([address])

module.exports = {
  assignWallet,
  getWalletBalance,
  createWallet,
  createWallets,
}
