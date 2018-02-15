const {getERC20TokenContract, web3} = require('./blockchain')

const {
  requiredConfirmations,
  maxBlocksRead,
} = require('app/config')

const {
  loggers: {logger},
} = require('@welldone-software/node-toolbelt')

const {
  validateAddress,
  weiToEther,
} = require('app/utils')

const getLastConfirmedBlock = async () => {
  const currentBlock = await web3.eth.getBlockNumber()
  return (currentBlock - requiredConfirmations)
}

const getLatestTransferTransactions = async (tokenAddress, fromBlock) => {
  validateAddress(tokenAddress)
  const tokenContract = getERC20TokenContract(tokenAddress)

  const toBlock = await getLastConfirmedBlock()
  if ((toBlock - fromBlock) > maxBlocksRead) {
    fromBlock = toBlock - maxBlocksRead
    fromBlock = fromBlock < 0 ? fromBlock = 0 : fromBlock
  }

  if (fromBlock > toBlock) {
    logger.info(`Block number ${fromBlock} does not have enough confirmations (${requiredConfirmations}). 
    Current block number is ${await web3.eth.getBlockNumber()}`)
  }

  const transactions = []
  const events = await tokenContract.getPastEvents('Transfer', {fromBlock, toBlock})
  events.forEach((event) => {
    const transaction = {
      // eslint-disable-next-line no-underscore-dangle
      from: event.returnValues._from,
      // eslint-disable-next-line no-underscore-dangle
      to: event.returnValues._to,
      // eslint-disable-next-line no-underscore-dangle
      amount: weiToEther(event.returnValues._value),
      logIndex: event.logIndex,
      transactionIndex: event.transactionIndex,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      event,
    }

    transactions.push(transaction)
    // if (weiToEther(event.returnValues._value) > 50000) {
    //   transactions.push(transaction)
    // }
  })

  return ({fromBlock, toBlock, transactions})
}

const getAccountBalance = async (tokenAddress, owner, blockNumber) => {
  validateAddress(tokenAddress)
  validateAddress(owner)
  const tokenContract = getERC20TokenContract(tokenAddress)

  const lastConfirmedBlock = await getLastConfirmedBlock()
  if (blockNumber >= lastConfirmedBlock) {
    logger.info(`Ethereum node is behind database last confirmed block. db block is ${blockNumber}.
     node block is ${lastConfirmedBlock}.`)
  }

  blockNumber = lastConfirmedBlock
  return tokenContract.methods.balanceOf(owner).call(undefined, blockNumber)
}

const getAccountBalanceInEther = async (tokenAddress, owner, blockNumber) => ({
  balance: Number(weiToEther(await getAccountBalance(tokenAddress, owner, blockNumber))),
})

module.exports = {
  getLatestTransferTransactions,
  getAccountBalanceInEther,
}
