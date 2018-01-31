const {loggers: {logger}, exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const db = require('app/db')
const {getSmartWalletContract} = require('./blockchain')
const {maxWalletAssignRetires, network} = require('app/config')
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
  return !isAddressEmpty((await getWallet(walletAddress)).userWithdrawalAccount)
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
              {network: {[Op.eq]: network}},
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

const assignWallet = async (withdrawAddress, times = 1) => {
  if (times >= maxWalletAssignRetires) {
    throw new Error('too many tries')
  }

  const wallet = await tryAssignWallet()

  if (!wallet) {
    throw new UnexpectedError('wallets pool is empty')
  }

  try {
    //todo: validate withdraw address
    // if (await isWithdrawAddressSet(wallet.address)) {
    //   await wallet.updateAttributes({corruptedAt: new Date()})
    //   logger.info({wallet}, 'CORRUPTED')
    //
    //   return assignWallet(withdrawAddress, ++times)
    // }

    //todo: set withdraw address
    // if (await setWithdrawAddress(wallet.address, withdrawAddress)) {
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

const getWalletBalance = async walletAddress =>
  db.tokensBalances.findAll({
    attributes: ['tokenId', 'balance'],
    where: {walletId: {[Op.eq]: `${network}.${walletAddress}`}},
  })

const createWallet = async address =>
  db.wallets.create({
    id: `${network}.${address}`,
    address,
    network,
    version: 1,
  })

const mockWallets = async () => {
  const addresses = [
    '0xF87a7EC94884F44D9dE33d36b73F42c7c0Dd38B1',
    '0xb1C5FaEEc6AD4Ff9FeeD18ad76A459aAf7344D7C',
    '0x972bc28f0618084ebbd8093b49ea1ea0c2d2af45',
    '0x1db40ef4a9f71a3c207f99a7a0b5efd6d44dba54',
    '0x9c0a1f6f5453841f889234915ffba500843f6c38',
    '0xf85bf5db8c666b387fe3652511558ebd07f86992',
    '0x05ee546c1a62f90d7acbffd6d846c9c54c7cf94c',
    '0x6a18154fe15c015493509124d19ccccfa43a495e',
    '0xf07232bc85d995c32c1edf1c985c84a8b7b0ded7',
    '0x23371c26fb713fea32d8a93ef3a1470af328ce36',
    '0x93730c556f269d317b048c39d2b531dcb4e3f9b4',
    '0xe5c04927498ab502624c774e04679dd0dff2ef41',
    '0x2a02fd8a18d771358c2d6ee10116db63b138c71d',
    '0x321d5a4c9f9f0c9607df5464d993bebb0ad25fb1',
    '0xa50ecf9316e1a9217ff6f2e6c42caa38f314ffdd',
    '0x36303b3c5850bb04dbb8ae8eb92e58f6ad9b8f84',
    '0x746e17548b63b0689e054d84a09abe1f5b70672c',
    '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45',
    '0xf87a7ec94884f44d9de33d36b73f42c7c0dd38b1',
    '0x97bc7fad76c9216f46ae5a612a31e5af5403bf04',
    '0x2e042052fee09197ee23ade01470fdff7ed75f6a',
    '0xcd6520c1c706285233ed7cebfce63da5021d6947',
    '0x179ce281905c38cfbf16f4d262a53ed3dbb9980c',
    '0x5c3a831b7f553b3ea0922a789bf7f92425964700',
    '0x2b5634c42055806a59e9107ed44d43c426e58258',
    '0x75db615870045b23a4bf288cd44c22473a88f5fe',
    '0xcb64900e062782bec62aaa6e8d83a8c1de5087e7',
    '0x4b01721f0244e7c5b5f63c20942850e447f5a5ee',
    '0x7f9fc89d2a54d083151509d6e36df461c14e32ca',
    '0x87b38f3d0fdc7d4721c4d8726da82be9867cb474',
    '0x5e575279bf9f4acf0a130c186861454247394c06',
    '0xffaf71eb90a4333a1ac9c626112682703cee59ea',
    '0x4ccac295b6dff5dcf2ccd44fae8a4b0f4e2238b4',
    '0xf8cff3ee7ed0dae877b2ce78b5c8829d732d28cd',
    '0x8b844a0c44d372e5da1da2954796791b339d118c',
    '0xfeeeff95a42a5de2f2a84136cf05f95c4e68523e',
    '0xecc996953e976a305ee585a9c7bbbcc85d1c467b',
    '0xef608e0afed912e6d6653836dda558efe64368b1',
    '0x14af3a47822d089b6d387b91eee05e7b1d7dc125',
  ]
  return db.sequelize.transaction().then(async (transaction) => {
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
}

module.exports = {
  assignWallet,
  getWalletBalance,
  mockWallets,
  createWallet,
}
