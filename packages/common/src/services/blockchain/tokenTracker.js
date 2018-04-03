const {validateAddress, weiToEther, getLastConfirmedBlock} = require('../../utils/blockchain')
const {blockchain} = require('../../context')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')

const getLatestTransferTransactions = async (tokenAddress, fromBlock, toBlock) => {
  validateAddress(tokenAddress)
  const tokenContract = blockchain.getERC20TokenContract(tokenAddress)
  const transactions = []
  const events = await tokenContract.getPastEvents('Transfer', {fromBlock, toBlock})

  events.forEach((event) => {
    const transaction = {
      from: event.returnValues._from, // eslint-disable-line no-underscore-dangle
      to: event.returnValues._to, // eslint-disable-line no-underscore-dangle
      amount: weiToEther(event.returnValues._value), // eslint-disable-line no-underscore-dangle
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

  return transactions
}

const getAccountBalance = async (tokenAddress, owner, blockNumber) => {
  validateAddress(tokenAddress)
  validateAddress(owner)
  const tokenContract = blockchain.getERC20TokenContract(tokenAddress)

  const lastConfirmedBlock = await getLastConfirmedBlock()
  if (blockNumber >= lastConfirmedBlock) {
    throw new UnexpectedError(`Ethereum node is behind database last confirmed block. db block is ${blockNumber}.
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
