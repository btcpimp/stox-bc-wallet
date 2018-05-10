const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const context = require('../context')
const blockchain = require('../utils/blockchain')
const {getAccountBalanceInEther} = require('./blockchain/tokenTracker')
const {validateAddress, isAddressEmpty} = require('../utils/blockchain')
const uuid = require('uuid')
const {getWithdrawalAddress} = require('./blockchain/smartWallets')

const {Op} = Sequelize
const {db, mq, config} = context

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
const validateWalletIsUnassigned = async (wallet) => {
  const isWalletUnssignedOnBlockchain = isAddressEmpty(await getWithdrawalAddress(wallet.address))
  if (!isWalletUnssignedOnBlockchain) {
    throw new Error(`wallet: ${wallet.address} is already assigned on blockchain`)
  }
}

const getUnassignedWallet = async () => {
  const wallet = await db.wallets.findOne({
    where: {
      [Op.and]: [
        {assignedAt: {[Op.eq]: null}},
        {corruptedAt: {[Op.eq]: null}},
        {network: {[Op.eq]: config.network}},
      ],
    },
  })

  if (!wallet) {
    throw new UnexpectedError('no unassigned wallets')
  }
  return wallet
}

const setWalletAsAssigned = async (wallet) => {
  const transaction = await db.sequelize.transaction()
  try {
    await wallet.updateAttributes({assignedAt: new Date()}, {transaction})
    await transaction.commit()
  } catch (e) {
    transaction.rollback()
    throw e
  }
}

const sendAssignRequest = async (wallet, withdrawAddress) => {
  mq.publish('incoming-requests', {
    id: uuid(),
    data: {walletAddress: wallet.address, userWithdrawalAddress: withdrawAddress},
    type: 'setWithdrawalAddress',
  })
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

    context.logger.info({addresses}, 'CREATED_NEW_WALLETS')
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
    const wallet = await getUnassignedWallet()
    await setWalletAsAssigned(wallet)
    await validateWalletIsUnassigned(wallet)
    sendAssignRequest(wallet, withdrawAddress)
    context.logger.info({wallet: wallet.dataValues}, 'ASSIGNED')
    return wallet
  } catch (e) {
    context.logger.error(e)
    return assignWallet(withdrawAddress, ++times, max++)
  }
}

const getWalletBalanceInBlockchain = async (walletAddress) => {
  validateAddress(walletAddress)

  const tokens = await db.tokens.findAll({
    attributes: ['name', 'address'],
  })

  return Promise.all(tokens.map(async token => ({
    token: token.name,
    balance: (await getAccountBalanceInEther(token.address, walletAddress)).balance,
  })))
}

module.exports = {
  getUnassignedWalletsCount,
  getWalletsByAddresses,
  getWalletBalanceInBlockchain,
  assignWallet,
  createWallets,
  createWallet,
}
