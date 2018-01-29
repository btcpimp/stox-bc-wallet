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

  const lastReadBlockNumber = Number(row.lastReadBlockNumber)
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
      const tokenValues = await db.tokensTransfersReads.findOne({where: {tokenId: {[Op.eq]: token.id}}})
      await tokenValues.updateAttributes({lastReadBlockNumber: toBlock}, {transaction})
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
      throw new UnexpectedError('savingFailed', e)
    }
  })

const updatePendingBalance = async (wallets, token) => {
  const promises = wallets.map(wallet =>
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
          throw new UnexpectedError('savingFailed', e)
        }
      }))

  return Promise.all(promises).then(() => {
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
          const {walletId, tokenId, pendingUpdateBalance} = tokenBalance
          const walletAddress = walletId.split('.').pop()
          const tokenAddress = tokenId.split('.').pop()
          const {balance} = await tokenTracker.getAccountBalanceInEther(tokenAddress, walletAddress)

          await tokenBalance.update(
            {
              balance,
              pendingUpdateBalance: Number(pendingUpdateBalance) - 1,
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
            logger.error(e.original ? e.original : e)
            promise = null
          })
      }
    })
  }

  return job
}

const cancelJob = async (name) => {
  const job = jobs[name]

  if (job) {
    logger.info({name}, 'STOPPED')
    job.cancel()
  }
}

module.exports = {
  startTokensTransfers: async () => scheduleJob('tokensTransfers', tokenTransferCron, readWriteTransactions),

  startTokensBalances: async () => scheduleJob('tokensBalances', updateBalanceCron, updateTokensBalances),

  stopTokensTransfers: async () => cancelJob('tokensTransfers'),

  stopTokensBalances: async () => cancelJob('tokensBalances'),
}
