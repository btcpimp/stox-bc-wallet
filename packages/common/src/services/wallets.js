const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError, InvalidStateError}} = require('@welldone-software/node-toolbelt')
const context = require('../context')
const blockchain = require('../utils/blockchain')
const {getAccountTokenBalance} = require('./blockchain/tokenTracker')
const {addPendingRequests} = require('./pendingRequests')
const uuid = require('uuid')
const {isWalletAssignedOnBlockchain} = require('./blockchain/smartWallets')
const {errors: {logError}} = require('stox-common')

const {Op, fn, col, where} = Sequelize
const {db, mq, config} = context

const getWalletsByAddresses = addresses =>
  db.sequelize.query(`select * from wallets where lower(address) similar to '%(${addresses})%'`, {
    type: Sequelize.QueryTypes.SELECT,
  })

const getWalletByAddress = address =>
  db.wallets.findOne({where: where(fn('lower', col('address')), fn('lower', address))})

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
const validateWalletIsUnassignedOnBlockchain = async (wallet) => {
  if (await isWalletAssignedOnBlockchain(wallet.address)) {
    await wallet.updateAttributes({corruptedAt: new Date()})
    throw new InvalidStateError(`wallet: ${wallet.address} is already assigned on blockchain`)
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

const sendSetWithdrawalAddressRequest = async (depositAddress, withdrawAddress) => {
  const id = uuid()
  mq.publish('incoming-requests', {
    id,
    data: {walletAddress: depositAddress, userWithdrawalAddress: withdrawAddress},
    type: 'setWithdrawalAddress',
  })
  await addPendingRequests('setWithdrawalAddress', id)
  return id
}

const createWallet = async (address, dbTransaction) => {
  const {network} = config
  db.wallets.create(
    {
      id: `${network}.${address}`,
      address,
      network,
      version: 2,
    },
    {transaction: dbTransaction}
  )
  context.logger.info({address}, 'CREATED_NEW_WALLET')
}

const createWallets = async (addresses) => {
  const dbTransaction = await db.sequelize.transaction()
  try {
    await Promise.all(addresses.map(address => createWallet(address, dbTransaction)))
    await dbTransaction.commit()
  } catch (e) {
    context.logger.error({addresses}, 'ERROR_CREATE_WALLETS')
    logError(e)
    await dbTransaction.rollback()
  }
}

const assignWallet = async (withdrawAddress, times = 1, max = 10) => {
  const {maxWalletAssignRetires} = config
  blockchain.validateAddress(withdrawAddress)

  if (times >= maxWalletAssignRetires || times >= max) {
    throw new Error('too many tries')
  }

  try {
    const wallet = await getUnassignedWallet()
    await validateWalletIsUnassignedOnBlockchain(wallet)
    const isUpdated = await db.wallets.update({assignedAt: new Date()}, {where: {id: wallet.id, assignedAt: null}})
    if (!isUpdated[0]) {
      throw new UnexpectedError(`address ${wallet.address} is already assign`)
    }
    const requestId = await sendSetWithdrawalAddressRequest(wallet.address, withdrawAddress)
    context.logger.info({wallet: wallet.dataValues, requestId}, 'ASSIGNED')
    return wallet
  } catch (e) {
    context.logger.error(e)
    return assignWallet(withdrawAddress, ++times, max++)
  }
}

const getWalletBalanceInBlockchain = async (walletAddress) => {
  blockchain.validateAddress(walletAddress)

  const tokens = await db.tokens.findAll({
    attributes: ['name', 'address'],
  })

  return Promise.all(tokens.map(async token => ({
    token: token.name,
    balance: (await getAccountTokenBalance(walletAddress, token.address)).balance,
  })))
}

module.exports = {
  getUnassignedWalletsCount,
  getWalletsByAddresses,
  getWalletByAddress,
  getWalletBalanceInBlockchain,
  assignWallet,
  createWallets,
  createWallet,
}
