const {loggers: {logger}, exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const {db} = require('stox-common')
// todo - change to opts
const {validateAddress, isAddressEmpty} = require('../utils/blockchain')
const {Op} = Sequelize

const maxWalletAssignRetires = 10

const getWallet = async (walletAddress, blockchain) => {
  validateAddress(walletAddress)
  const walletContract = blockchain.getSmartWalletContract(walletAddress.toLowerCase())
  const {operatorAccount, backupAccount, feesAccount, userWithdrawalAccount} =
    await walletContract.methods.wallet().call()

  return {walletAddress, operatorAccount, backupAccount, feesAccount, userWithdrawalAccount}
}

const isWithdrawAddressSet = async (walletAddress, blockchain) => {
  validateAddress(walletAddress)
  return !isAddressEmpty((await getWallet(walletAddress.toLowerCase()), blockchain).userWithdrawalAccount)
}

const tryAssignWallet = async () =>
  db.sequelize.transaction()
    .then(async (transaction) => {
      try {
        const wallet = await db.wallets.findOne({
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
    })

const assignWallet = async (withdrawAddress, network, times = 1) => {
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
    return assignWallet(withdrawAddress, network, ++times)
  }
}

const getWalletBalance = async (walletAddress, network) => {
  validateAddress(walletAddress)
  // todo: implement case sensitive query
  db.tokensBalances.findAll({
    attributes: ['tokenId', 'balance'],
    where: {walletId: {[Op.eq]: `${network}.${walletAddress}`}},
  })
}

const getUnassignedWalletsCount = async (network) => {
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

const createWallets = async (addresses, network) =>
  db.sequelize.transaction().then(async (transaction) => {
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

const createWallet = async (address, network) => createWallets([address], network)

module.exports = {
  assignWallet,
  getWalletBalance,
  createWallet,
  createWallets,
  getUnassignedWalletsCount,
}
