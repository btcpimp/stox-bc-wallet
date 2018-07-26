/* eslint-disable no-underscore-dangle */
const {validateAddress, getDecimalsByToken, tokenWeiToDecimals} = require('../../utils/blockchain')
const {blockchain} = require('../../context')

const getLatestTransferTransactions = async (tokenAddress, fromBlock, toBlock) => {
  validateAddress(tokenAddress)
  const tokenContract = blockchain.getERC20TokenContract(tokenAddress)
  const events = await tokenContract.getPastEvents('Transfer', {fromBlock, toBlock})
  const decimals = await getDecimalsByToken(tokenAddress)

  return Promise.all(events.map(async event => ({
    from: event.returnValues._from,
    to: event.returnValues._to,
    amount: await tokenWeiToDecimals({amount: event.returnValues._value, decimals}),
    logIndex: event.logIndex,
    transactionIndex: event.transactionIndex,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    event,
  })))
}


const getAccountTokenBalance = async (accountAddress, tokenAddress) => {
  validateAddress(tokenAddress)
  validateAddress(accountAddress)

  const tokenContract = blockchain.getERC20TokenContract(tokenAddress)
  const accountBalance = await tokenContract.methods.balanceOf(accountAddress).call()
  const balance = await tokenWeiToDecimals({amount: accountBalance, tokenAddress})
  return {balance}
}

module.exports = {
  getLatestTransferTransactions,
  getAccountTokenBalance,
}
