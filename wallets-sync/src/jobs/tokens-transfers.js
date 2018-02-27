const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {mq} = require('stox-common')
const {network, tokenTransferCron, maxBlocksRead, requiredConfirmations} = require('config')
const {
  tokens,
  tokensTransfersReads,
  tokensTransfers,
  blockchain: {getBlockData, getLastConfirmedBlock},
  promises: {promiseSerial},
  errorHandle: {logError},
  tokenTracker,
} = require('common')

const {flatten, uniq} = require('lodash')

const getNextBlocksRange = async (token, maxBlocksRead, requiredConfirmations) => {
  const lastReadBlockNumber = await tokensTransfersReads.fetchLastReadBlock(token.id)
  let fromBlock = lastReadBlockNumber !== 0 ? lastReadBlockNumber + 1 : 0
  const toBlock = await getLastConfirmedBlock(requiredConfirmations)

  if (toBlock - fromBlock > maxBlocksRead) {
    fromBlock = toBlock - maxBlocksRead
    fromBlock = fromBlock < 0 ? (fromBlock = 0) : fromBlock
  }

  if (fromBlock > toBlock) {
    logger.info(
      {
        network,
        token: token.name,
        fromBlock,
        lastConfirmedBlock: toBlock,
        requiredConfirmations,
      },
      'NOT_ENOUGH_CONFIRMATIONS'
    )
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

    logger.info(
      {
        network,
        token: name,
        transactions: transactions.length,
        fromBlock,
        toBlock,
        currentBlock,
        currentBlockTime: currentBlockTime.toUTCString(),
      },
      'READ_TRANSACTIONS'
    )

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
    logger.info(
      {
        network,
        token: token.name,
        currentBlockTime,
        transactions: transactions.length,
      },
      'WRITE_TRANSACTIONS'
    )
  } catch (e) {
    logError(e)
  }
}

const updateBalance = async (token, wallet, balance) => {
  try {
    await tokensBalances.updateBalance(token.id, wallet.id, balance)
    logger.info(
      {
        network,
        token: token.name,
        walletAddress: wallet.address,
        balance,
      },
      'UPDATE_BALANCE'
    )
  } catch (e) {
    logError(e)
  }
}

const getWalletsFromTransactions = async (transactions) => {
  const addresses = uniq(flatten(transactions.map(t => [t.to.toLowerCase(), t.from.toLowerCase()]))).join('|')
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
  transactions.filter(t => t.to.toLowerCase() === address.toLowerCase() || t.from.toLowerCase() === address.toLowerCase())

const updateTokenBalances = async ({token, wallet, tokenTransactions, currentBlockTime, network, sender}) => {
  const balance = await getBalanceInEther(token, wallet)
  const {address} = wallet
  const addressTransactions = filterTransactionsByAddress(tokenTransactions, address.toLowerCase())

  await updateBalance(token, wallet, balance)
  const messageToService = {
    network,
    address,
    asset: token.name,
    balance,
    happenedAt: currentBlockTime,
    transactions: addressTransactions.map(({transactionHash, to, amount}) => ({
      transactionHash,
      amount,
      status: 'confirmed',
      type: to.toLowerCase() === address.toLowerCase() ? 'deposit' : 'withdraw',
    })),
  }
  await sender(messageToService)
}

//TODO: null otherwise , checkout why
const a = tokens
module.exports = {
  cron: tokenTransferCron,
  job: async () => {
    const tokens = await a.getTokensByNetwork(network)
    const promises = tokens.map(token => async () => {
      const blocksRange = await getNextBlocksRange(token, maxBlocksRead, requiredConfirmations)

      if (blocksRange) {
        const {fromBlock, toBlock} = blocksRange
        const {transactions, currentBlockTime} = await fetchLatestTransactions(token, fromBlock, toBlock)

        if (transactions.length) {
          const wallets = await getWalletsFromTransactions(transactions)
          const tokenTransactions = filterTransactionsByWallets(transactions, wallets)

          if (tokenTransactions.length) {
            await insertTransactions(token, tokenTransactions, currentBlockTime)
          }

          const funcs = wallets.map(wallet => () =>
            updateTokenBalances({
              token,
              wallet,
              tokenTransactions,
              currentBlockTime,
              network,
              sender: transactions => mq.sendMessageToQueue('backend-server/incoming-transactions', transactions),
            }))

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
  },
}
