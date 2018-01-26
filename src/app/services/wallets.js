const {loggers: {logger}, exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const db = require('app/db')
const {getSmartWalletContract} = require('./blockchain')
const {maxWalletAssignRetires} = require('app/config')
const {validateAddress, isAddressEmpty} = require('app/utils')

const {Op} = Sequelize

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

const tryAssignWallet = async () =>
  db.sequelize.transaction({lock: Sequelize.Transaction.LOCK.UPDATE})
    .then(async (transaction) => {
      try {
        const wallet = await db.wallets.findOne({
          where: {
            [Op.and]: [
              {assignedAt: {[Op.eq]: null}},
              {setWithdrawAddressAt: {[Op.eq]: null}},
              {corruptedAt: {[Op.eq]: null}},
            ],
          },
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

const assignWallet = async (times = 1) => {
  if (times >= maxWalletAssignRetires) {
    throw new Error('too many tries')
  }

  try {
    const wallet = await tryAssignWallet()
    if (await isWithdrawAddressSet(wallet.address)) {
      await wallet.updateAttributes({corruptedAt: new Date()})
      logger.info({wallet}, 'CORRUPTED')
      return assignWallet(++times)
    }

    logger.info({wallet}, 'ASSIGNED')
    return wallet
  } catch (e) {
    logger.error(e)
    return assignWallet(++times)
  }
}

module.exports = {
  assignWallet,
}
