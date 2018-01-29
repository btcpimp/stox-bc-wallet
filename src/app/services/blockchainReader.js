const schedule = require('node-schedule')
const {flatten, uniq} = require('lodash')
const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const {promiseSerial} = require('../promise')
const {network, tokenTransferCron, updateBalanceCron} = require('app/config')
const {getBlockTime} = require('app/utils')
const {web3} = require('./blockchain')

const {Op} = Sequelize

const fetchLatestTransactions = async ({id, address}) => {
  const row = await db.tokensTransfersReads.findOne({
    attributes: ['lastReadBlockNumber'],
    where: {tokenId: {[Op.eq]: id}},
  })

  const lastReadBlockNumber = row ? Number(row.lastReadBlockNumber) : 0
  const fromBlock = row ? lastReadBlockNumber === 0 ? lastReadBlockNumber : lastReadBlockNumber + 1 : 0
  const currentBlock = await web3.eth.getBlockNumber()
  const currentBlockTime = await getBlockTime(currentBlock)

  try {
    const result = await tokenTracker.getLatestTransferTransactions(address, fromBlock)
    return {
      ...result,
      fromBlock,
      currentBlock,
      currentBlockTime,
    }
  } catch (e) {
    throw new UnexpectedError('blockchainReadFailed', e)
  }
}

const insertTransactions = async (token, transactions, toBlock, currentBlockTime) =>
  db.sequelize.transaction().then(async (transaction) => {
    try {
      await db.tokensTransfersReads.upsert(
        {
          tokenId: token.id,
          lastReadBlockNumber: toBlock,
        },
        {transaction},
      )
      await Promise.all(transactions.map(async (t) => {
        const {
          amount,
          blockNumber,
          logIndex,
          from,
          to,
          transactionHash,
          event,
        } = t
        return db.tokensTransfers.create(
          {
            blockNumber: Number(blockNumber),
            logIndex,
            transactionHash,
            tokenId: token.id,
            network,
            currentBlockTime,
            fromAddress: from,
            toAddress: to,
            amount: Number(amount),
            rawData: event,
          },
          {transaction}
        )
      }))

      await transaction.commit()
      logger.info({
        network,
        token: token.name,
        transactions: transactions.length,
      }, 'WRITE_TRANSACTIONS')
    } catch (e) {
      transaction.rollback()
      throw new UnexpectedError('insertTransactionsFailed', e)
    }
  })

const updatePendingBalance = async (wallets, token) => {
  const promises = wallets.map(wallet => () =>
    db.sequelize.transaction({lock: Sequelize.Transaction.LOCK.UPDATE})
      .then(async (transaction) => {
        try {
          const walletId = wallet.id
          const tokenId = token.id
          const tokenBalance = await db.tokensBalances.findOne({
            where: {
              [Op.and]: [
                {walletId: {[Op.eq]: walletId}},
                {tokenId: {[Op.eq]: tokenId}},
              ],
            },
            transaction,
          })

          if (!tokenBalance) {
            await db.tokensBalances.create(
              {
                walletId,
                tokenId,
                pendingUpdateBalance: 1,
                balance: 0,
              },
              {transaction}
            )
          } else {
            await tokenBalance.update(
              {
                pendingUpdateBalance: Number(tokenBalance.pendingUpdateBalance) + 1,
              },
              {
                where: {
                  walletId,
                  tokenId,
                },
              },
              {transaction}
            )
          }

          transaction.commit()
        } catch (e) {
          transaction.rollback()
          throw new UnexpectedError('updatePendingBalanceFailed', e)
        }
      }))

  return promiseSerial(promises).then(() => {
    logger.info({
      network,
      token: token.name,
      wallets: wallets.length,
    }, 'PENDING_UPDATE_BALANCE')
  })
}

const readWriteTransactions = async () =>
  db.tokens.findAll({where: {network: {[Op.eq]: network}}})
    .then(tokens => promiseSerial(tokens.map(token => async () => {
      const {
        transactions: allTransactions,
        fromBlock,
        toBlock,
        currentBlock,
        currentBlockTime,
      } = await fetchLatestTransactions(token)

      logger.info({
        network,
        token: token.name,
        allTransactions: allTransactions.length,
        fromBlock,
        toBlock,
        currentBlock,
        currentBlockTime: new Date(currentBlockTime).toUTCString(),
      }, 'READ_TRANSACTIONS')

      let transactions = []

      if (allTransactions.length) {
        const addresses = uniq(flatten(transactions.map(t => ([t.to, t.from]))))
        const wallets = await db.wallets.findAll({
          attributes: ['id', 'address'],
          where: {address: {[Op.or]: addresses}},
        })

        const walletAddresses = wallets.map(w => w.address)
        transactions = allTransactions.filter(t => walletAddresses.includes(t.to) || walletAddresses.includes(t.from))

        if (transactions.length) {
          await updatePendingBalance(wallets, token)
        }
      }

      await insertTransactions(token, transactions, toBlock, currentBlockTime)
    })))

const updateTokensBalances = async () =>
  db.sequelize.transaction({lock: Sequelize.Transaction.LOCK.UPDATE})
    .then(async (transaction) => {
      try {
        const tokenBalance = await db.tokensBalances.findOne({
          where: {pendingUpdateBalance: {[Op.gt]: 0}},
          transaction,
        })

        if (tokenBalance) {
          const {walletId, tokenId} = tokenBalance
          const walletAddress = walletId.split('.').pop()
          const tokenAddress = tokenId.split('.').pop()
          const {balance} = await tokenTracker.getAccountBalanceInEther(tokenAddress, walletAddress)

          await tokenBalance.update(
            {
              balance,
              pendingUpdateBalance: 0,
            },
            {
              where: {
                walletId,
                tokenId,
              },
            },
            {transaction}
          )

          logger.info({
            network,
            tokenAddress,
            walletAddress,
            balance,
          }, 'UPDATE_BALANCE')
        }

        transaction.commit()
      } catch (e) {
        transaction.rollback()
        throw new UnexpectedError('updateBalanceFailed', e)
      }
    })

const jobs = {}
const scheduleJob = async (name, spec, func) => {
  logger.info({name}, 'STARTED')

  let promise = null
  const job = jobs[name]

  if (!job) {
    jobs[name] = schedule.scheduleJob(spec, async () => {
      if (!promise) {
        logger.info({name}, 'IN_CYCLE')

        promise = func()
          .then(() => {
            promise = null
          })
          .catch((e) => {
            if (e.original) {
              logger.error({...e.original}, e.message)
            } else {
              logger.error(e)
            }

            promise = null
          })
      }
    })
  }
}

const cancelJob = async (name) => {
  const job = jobs[name]

  if (job) {
    logger.info({name}, 'STOPPED')
    job.cancel()
  }
}

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
  mockWallets,

  startTokensTransfers: async () => scheduleJob('tokensTransfers', tokenTransferCron, readWriteTransactions),

  startTokensBalances: async () => scheduleJob('tokensBalances', updateBalanceCron, updateTokensBalances),

  stopTokensTransfers: async () => cancelJob('tokensTransfers'),

  stopTokensBalances: async () => cancelJob('tokensBalances'),
}
