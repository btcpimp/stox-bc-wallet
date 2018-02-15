const {flatten, uniq} = require('lodash')
const Sequelize = require('sequelize')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')
const tokenTracker = require('../services/tokenTracker')
const backendApi = require('../services/backendApi')
const {promiseSerial} = require('../promise')
const {network, tokenTransferCron} = require('app/config')
const {getBlockTime, getCurrentBlockNumber} = require('app/utils')
const {scheduleJob, cancelJob} = require('../scheduleUtils')
const {logError} = require('../errorHandle')
const tokensTransfersReads = require('./db/tokensTransfersReads')
const tokensTransfers = require('./db/tokensTransfers')
const tokensBalances = require('./db/tokensBalances')

const {Op} = Sequelize

const fetchLatestTransactions = async ({id, name, address}) => {
  const lastReadBlockNumber = await tokensTransfersReads.fetchLastReadBlock(id)
  const fromBlock = lastReadBlockNumber !== 0 ? lastReadBlockNumber + 1 : 0
  const currentBlock = await getCurrentBlockNumber()

  try {
    const currentBlockTime = await getBlockTime(currentBlock)
    const result = await tokenTracker.getLatestTransferTransactions(address, fromBlock)

    logger.info({
      network,
      token: name,
      transactions: result.transactions.length,
      fromBlock: result.fromBlock,
      toBlock: result.toBlock,
      currentBlock,
      currentBlockTime: new Date(currentBlockTime).toUTCString(),
    }, 'READ_TRANSACTIONS')

    return {
      ...result,
      currentBlock,
      currentBlockTime,
    }
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, current block: ${currentBlock}, ${e.message}`, e)
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

let counter = 0
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
    // await backendApi.sendTransactionMessage(message)
    counter += message.transactions.length
    logger.info({counter}, 'SEND_TRANSACTIONS')
  } catch (e) {
    logError(e)
  }
}

const getWalletsFromTransactions = async (transactions) => {
  const addresses = uniq(flatten(transactions.map(t => ([t.to.toLowerCase(), t.from.toLowerCase()])))).join('|')
  // todo: sould we filter unassigned wallets ?
  return db.sequelize.query(
    `select * from wallets where lower(address) similar to '%(${addresses})%'`,
    {type: Sequelize.QueryTypes.SELECT},
  )
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
  const tokens = await db.tokens.findAll({where: {network: {[Op.eq]: network}}})
  return promiseSerial(tokens.map(token => async () => {
    const {transactions, toBlock, currentBlockTime} = await fetchLatestTransactions(token)

    if (transactions.length) {
      const tran1 = transactions.find(t => t.transactionHash === '0xef0ca6d8ab2c4838be8052d36294699c7f182bc6881d23bfa172e6761b002f2b')
      const tran2 = transactions.find(t => t.transactionHash === '0x41f62f9ec48062af486f86b743c6cb951e9dc631c5f246724e0f39eec429d68d')
      const tran3 = transactions.find(t => t.transactionHash === '0x96f7f96490743a72076cb42b02ca57feb9b0638234c5a248a5e28adffa5ac748')

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
  }))
}

module.exports = {
  start: async () => scheduleJob('tokensTransfers', tokenTransferCron, tokensTransfersJob),
  stop: async () => cancelJob('tokensTransfers'),
}
