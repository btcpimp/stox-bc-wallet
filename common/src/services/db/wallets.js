const Sequelize = require('sequelize')
const {loggers: {logger}, exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {db, config} = require('../../context')
const blockchain = require('../../utils/blockchain')

const {Op} = Sequelize

const getWalletsByAddresses = addresses =>
  db.sequelize.query(`select * from wallets where lower(address) similar to '%(${addresses})%'`, {
    type: Sequelize.QueryTypes.SELECT,
  })

const getUnassignedWalletsCount = async () => {
  const count = await db.wallets.count({
    where: {
      [Op.and]: [
        {assignedAt: {[Op.eq]: null}},
        {corruptedAt: {[Op.eq]: null}},
        {network: {[Op.eq]: config.network}},
      ],
    },
  })
  return {count}
}

const assign = async () => {
  const transaction = await db.sequelize.transaction()
  try {
    const wallet = await db.wallets.findOne({
      where: {
        [Op.and]: [
          {assignedAt: {[Op.eq]: null}},
          {corruptedAt: {[Op.eq]: null}},
          {network: {[Op.eq]: config.network}},
        ],
      },
      transaction,
    })

    if (!wallet) {
      throw new UnexpectedError('no unassigned wallets')
    }

    await wallet.updateAttributes({assignedAt: new Date()}, {transaction})
    await transaction.commit()

    return wallet
  } catch (e) {
    transaction.rollback()
    throw e
  }
}

const createWallets = async (addresses) => {
  const transaction = await db.sequelize.transaction()
  const {network} = config
  try {
    await Promise.all(addresses.map(address =>
      db.wallets.create(
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

const assignWallet = async (withdrawAddress, times = 1, max = 10) => {
  const {maxWalletAssignRetires} = config
  blockchain.validateAddress(withdrawAddress)

  if (times >= maxWalletAssignRetires || times >= max) {
    throw new Error('too many tries')
  }

  try {
    const wallet = await assign()
    logger.info(wallet, 'ASSIGNED')
    return wallet
  } catch (e) {
    logger.error(e)
    return assignWallet(withdrawAddress, ++times, max++)
  }
}

module.exports = {
  getUnassignedWalletsCount,
  getWalletsByAddresses,
  assignWallet,
  createWallets,
  createWallet,
}
