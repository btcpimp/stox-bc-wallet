const {flatten, uniq} = require('lodash')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {services, context, utils} = require('stox-bc-wallet-common')
const {network, tokensTransfersCron, requiredConfirmations, maxBlocksRead} = require('../config')
const {errors: {logError}} = require('stox-common')
const promiseSerial = require('promise-serial')

const extractAddresses = transactions =>
  uniq(flatten(transactions.map(t => [t.to.toLowerCase(), t.from.toLowerCase()]))).join('|')

const getBalanceInEther = async (tokenAddress, walletAddress, lastReadBlock) => {
  try {
    const {balance} = await services.blockchain.tokenTracker.getAccountBalanceInEther(
      tokenAddress,
      walletAddress,
      lastReadBlock
    )
    return balance
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

const fetchLatestTransactions = async (tokenAddress, fromBlock, toBlock) => {
  try {
    const {blockNumber: currentBlock, timestamp: currentBlockTime} = await utils.blockchain.getBlockData()
    const transactions = await services.blockchain.tokenTracker.getLatestTransferTransactions(
      tokenAddress,
      fromBlock,
      toBlock
    )
    return {
      transactions,
      currentBlockTime,
      currentBlock,
    }
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

const getNextBlocksRange = async (lastReadBlock) => {
  try {
    let fromBlock = lastReadBlock !== 0 ? lastReadBlock + 1 : 0
    const toBlock = await utils.blockchain.getLastConfirmedBlock()

    if (toBlock - fromBlock > maxBlocksRead) {
      fromBlock = toBlock - maxBlocksRead
      fromBlock = fromBlock < 0 ? (fromBlock = 0) : fromBlock
    }

    return {
      fromBlock,
      toBlock,
    }
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

const job = async () => {
  const {tokens, tokensTransfersReads, tokensTransfers, wallets, tokensBalances} = services
  const networkTokens = await tokens.getTokens(network)

  const getTokensTransfers = networkTokens.map(token => async () => {
    const lastReadBlock = await services.tokensTransfersReads.fetchLastReadBlock(token.id)
    const {fromBlock, toBlock} = await getNextBlocksRange(lastReadBlock)

    if (fromBlock < toBlock) {
      const {transactions, currentBlockTime, currentBlock} = await fetchLatestTransactions(
        token.address,
        fromBlock,
        toBlock
      )

      context.logger.info(
        {
          network,
          token: token.name,
          transactions: transactions.length,
          fromBlock,
          toBlock,
          currentBlock,
          currentBlockTime: currentBlockTime.toUTCString(),
        },
        'READ_TRANSACTIONS'
      )

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
            context.logger.info(
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

        const funcs = withdrawWallets.map(wallet => async () => {
          const tokenAddress = token.address
          const walletAddress = wallet.address
          const balance = await getBalanceInEther(tokenAddress, walletAddress, lastReadBlock)

          try {
            await tokensBalances.updateBalance(token.id, wallet.id, balance)
            context.logger.info(
              {
                network,
                token: token.name,
                walletAddress,
                balance,
              },
              'UPDATE_BALANCE'
            )
          } catch (e) {
            logError(e)
          }

          const walletTransactions = transactions.filter(t =>
            t.to.toLowerCase() === walletAddress.toLowerCase() || t.from.toLowerCase() === walletAddress.toLowerCase())

          tokensTransfers.sendTransactionsToBackend(
            token.name,
            walletAddress,
            walletTransactions,
            balance,
            currentBlockTime
          )
        })

        try {
          await promiseSerial(funcs)
        } catch (e) {
          logError(e)
        }
      }
      await tokensTransfersReads.updateLastReadBlock(token.id, toBlock)
    }
  })

  return promiseSerial(getTokensTransfers)
}

module.exports = {
  cron: tokensTransfersCron,
  job,
}
