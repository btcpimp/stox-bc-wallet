const {flatten, uniq, omit} = require('lodash')
const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('../db')
const tokenTracker = require('../services/tokenTracker')
const backendApi = require('../services/backendApi')
const {promiseSerial} = require('../utils/promises')
const {getBlockData, getLastConfirmedBlock} = require('../utils/blockchain')
const {logError} = require('../utils/errorHandle')
const {
  tokensTransfersReads,
  tokensTransfers,
  tokensBalances,
  tokens,
  wallets
} = require('./db')

// todo - change to opts
const {network, maxBlocksRead, requiredConfirmations} = require('../../../wallets-sync/src/app/config')

const {Op} = Sequelize

const getNextBlocksRange = async (token) => {
  const lastReadBlockNumber = await tokensTransfersReads.fetchLastReadBlock(token.id)
  let fromBlock = lastReadBlockNumber !== 0 ? lastReadBlockNumber + 1 : 0
  const toBlock = await getLastConfirmedBlock()

  if ((toBlock - fromBlock) > maxBlocksRead) {
    fromBlock = toBlock - maxBlocksRead
    fromBlock = fromBlock < 0 ? fromBlock = 0 : fromBlock
  }

  if (fromBlock > toBlock) {
    logger.info({
      network,
      token: token.name,
      fromBlock,
      lastConfirmedBlock: toBlock,
      requiredConfirmations,
    }, 'NOT_ENOUGH_CONFIRMATIONS')
    return null
  }

  return {
    fromBlock,
    toBlock,
  }
}

const fetchLatestTransactions = async ({name, address}, fromBlock, toBlock) => {
  try {
    const {blockNumber: currentBlock, timestamp: currentBlockTime} = await getBlockData()
    const transactions = await tokenTracker.getLatestTransferTransactions(address, fromBlock, toBlock)

    logger.info({
      network,
      token: name,
      transactions: transactions.length,
      fromBlock,
      toBlock,
      currentBlock,
      currentBlockTime: currentBlockTime.toUTCString(),
    }, 'READ_TRANSACTIONS')

    return {
      transactions,
      currentBlockTime,
    }
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

const insertTransactions = async (token, transactions, currentBlockTime) => {
  try {
    await tokensTransfers.insertTransactions(token.id, transactions, currentBlockTime)
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

const updateBalance = async (token, wallet, balance) => {
  try {
    await tokensBalances.updateBalance(token.id, wallet.id, balance)
    logger.info({
      network,
      token: token.name,
      walletAddress: wallet.address,
      balance,
    }, 'UPDATE_BALANCE')
  } catch (e) {
    logError(e)
  }
}

const sendMessageToBackend = async (token, wallet, transactions, balance, currentBlockTime) => {
  const walletAddress = wallet.address
  const message = {
    network,
    address: walletAddress,
    asset: token.name,
    balance,
    happenedAt: currentBlockTime,
    transactions: transactions.map(({transactionHash, to, amount}) => ({
      transactionHash,
      amount,
      status: 'confirmed',
      type: to.toLowerCase() === walletAddress.toLowerCase() ? 'deposit' : 'withdraw',
    })),
  }

  try {
    await backendApi.sendTransactionMessage(message)
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

const getWalletsFromTransactions = async (transactions) => {
  const addresses = uniq(flatten(transactions.map(t => ([t.to.toLowerCase(), t.from.toLowerCase()])))).join('|')
  // todo: should we filter unassigned wallets ?
  return wallets.getWalletsByAddresses(addresses)
}

const getBalanceInEther = async (token, wallet) => {
  const lastReadBlock = await tokensTransfersReads.fetchLastReadBlock(token.id)

  try {
    const {balance} = await tokenTracker.getAccountBalanceInEther(token.address, wallet.address, lastReadBlock)
    return balance
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

const filterTransactionsByWallets = (transactions, wallets) => {
  const addresses = wallets.map(w => w.address.toLowerCase())
  return transactions.filter(t => addresses.includes(t.to.toLowerCase()) || addresses.includes(t.from.toLowerCase()))
}

const filterTransactionsByAddress = (transactions, address) =>
  transactions.filter(t =>
    t.to.toLowerCase() === address.toLowerCase() ||
    t.from.toLowerCase() === address.toLowerCase())

const updateTokenBalances = async (token, wallet, tokenTransactions, currentBlockTime) => {
  const balance = await getBalanceInEther(token, wallet)
  const {address} = wallet
  const addressTransactions = filterTransactionsByAddress(tokenTransactions, address.toLowerCase())

  await updateBalance(token, wallet, balance)
  await sendMessageToBackend(token, wallet, addressTransactions, balance, currentBlockTime)
}

const tokensTransfersJob = async () => {

  const tokens = await tokens.getTokensByNetwork(network)
  const promises = tokens.map(token => async () => {
    const blocksRange = await getNextBlocksRange(token)

    if (blocksRange) {
      const {fromBlock, toBlock} = blocksRange
      const {transactions, currentBlockTime} = await fetchLatestTransactions(token, fromBlock, toBlock)

      if (transactions.length) {
        const wallets = await getWalletsFromTransactions(transactions)
        const tokenTransactions = filterTransactionsByWallets(transactions, wallets)

        if (tokenTransactions.length) {
          await insertTransactions(token, tokenTransactions, currentBlockTime)
        }

        const funcs = wallets.map(wallet =>
          () => updateTokenBalances(token, wallet, tokenTransactions, currentBlockTime))

        try {
          await promiseSerial(funcs)
        } catch (e) {
          logError(e)
        }
      }

      await tokensTransfersReads.updateLastReadBlock(token.id, toBlock)
    }
  })

  return promiseSerial(promises)
}

module.exports = {
  tokensTransfersJob
}
