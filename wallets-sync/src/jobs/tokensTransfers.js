const {flatten, uniq, omit} = require('lodash')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {mq} = require('stox-common')
const context = require('context')
const tokenTracker = require('../services/tokenTracker')
const blockchainUtils = require('../utils/blockchainUtils')
const {promiseSerial} = require('../utils/promise')
const {network, requiredConfirmations} = require('../config')
const {logError} = require('../utils/errorHandle')
const {createDatabaseServices} = require('stox-bc-wallet-common')

const extractAddresses = transactions =>
  uniq(flatten(transactions.map(t => ([t.to.toLowerCase(), t.from.toLowerCase()])))).join('|')

const getBalanceInEther = async (tokenAddress, walletAddress, lastReadBlock) => {
  try {
    const {balance} = await tokenTracker.getAccountBalanceInEther(tokenAddress, walletAddress, lastReadBlock)
    return balance
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

const fetchLatestTransactions = async (tokenAddress, fromBlock, toBlock) => {
  try {
    const {blockNumber: currentBlock, timestamp: currentBlockTime} = await blockchainUtils.getBlockData()
    const transactions = await tokenTracker.getLatestTransferTransactions(tokenAddress, fromBlock, toBlock)
    return {
      transactions,
      currentBlockTime,
      currentBlock,
    }
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

const sendTransactionsToBackend = async (asset, address, transactions, balance, happenedAt) => {
  const message = {
    network,
    address,
    asset,
    balance,
    happenedAt,
    transactions: transactions.map(({transactionHash, to, amount}) => ({
      transactionHash,
      amount,
      status: 'confirmed',
      type: to.toLowerCase() === address.toLowerCase() ? 'deposit' : 'withdraw',
    })),
  }

  try {
    mq.publish('assets-manager/walletTransactions', message)
    const rest = omit(message, 'transactions')
    logger.info({
      ...rest,
      transactions: transactions.length,
      hash: transactions.map(t => t.transactionHash),
    }, 'SEND_TRANSACTIONS')
  } catch (e) {
    logError(e)
  }
}

module.exports = {
  cron: '*/5 * * * * *',
  job: async () => {
    const {
      tokens,
      tokensTransfersReads,
      tokensTransfers,
      wallets,
      tokensBalances,
    } = createDatabaseServices(context)

    const networkTokens = await tokens.getTokensByNetwork(network)

    const getTokensTransfers = networkTokens.map(token => async () => {
      const lastReadBlock = await tokensTransfersReads.fetchLastReadBlock(token.id)
      const {fromBlock, toBlock} = await blockchainUtils.getNextBlocksRange(lastReadBlock)

      if (fromBlock < toBlock) {
        const {
          transactions,
          currentBlockTime,
          currentBlock,
        } = await fetchLatestTransactions(token.address, fromBlock, toBlock)

        logger.info({
          network,
          token: token.name,
          transactions: transactions.length,
          fromBlock,
          toBlock,
          currentBlock,
          currentBlockTime: currentBlockTime.toUTCString(),
        }, 'READ_TRANSACTIONS')

        if (transactions.length) {
          const addresses = extractAddresses(transactions)
          const withdrawWallets = await wallets.getWalletsByAddresses(addresses)

          const withdrawAddresses = withdrawWallets.map(w => w.address.toLowerCase())
          const walletsTransactions = transactions.filter(t =>
            withdrawAddresses.includes(t.to.toLowerCase()) ||
            withdrawAddresses.includes(t.from.toLowerCase()))

          if (walletsTransactions.length) {
            try {
              await tokensTransfers.insertTransactions(token.id, walletsTransactions, currentBlockTime, network)
              logger.info({
                network,
                token: token.name,
                currentBlockTime,
                transactions: transactions.length,
              }, 'WRITE_TRANSACTIONS')
            } catch (e) {
              logError(e)
            }
          }

          const funcs = withdrawWallets.map(wallet => async () => {
            const tokenAddress = token.address
            const walletAddress = wallet.address
            const balance = await getBalanceInEther(tokenAddress, walletAddress, lastReadBlock)

            try {
              await tokensBalances.updateBalance(token.id, wallet.id, balance)
              logger.info({
                network,
                token: token.name,
                walletAddress,
                balance,
              }, 'UPDATE_BALANCE')
            } catch (e) {
              logError(e)
            }

            const walletTransactions = transactions.filter(t =>
              t.to.toLowerCase() === tokenAddress.toLowerCase() ||
              t.from.toLowerCase() === walletAddress.toLowerCase())

            await sendTransactionsToBackend(token.name, walletAddress, walletTransactions, balance, currentBlockTime)
          })

          try {
            await promiseSerial(funcs)
          } catch (e) {
            logError(e)
          }
        }
        await tokensTransfersReads.updateLastReadBlock(token.id, toBlock)
      } else {
        logger.info({
          network,
          token: token.name,
          lastReadBlock,
          fromBlock,
          lastConfirmedBlock: toBlock,
          requiredConfirmations,
        }, 'NOT_ENOUGH_CONFIRMATIONS')
      }
    })

    return promiseSerial(getTokensTransfers)
  },
}
