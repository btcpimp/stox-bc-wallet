/* eslint-disable no-underscore-dangle */
const {validateAddress, getDecimalsByToken, tokenWeiToDecimals} = require('../../utils/blockchain')
const {blockchain, config} = require('../../context')
const {encodeAbiForSendPrize} = require('./smartWallets')
const {Big} = require('big.js')
const {http} = require('stox-common')

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

const estimateTokenTransfer = async ({tokenAddresses = [], from, priority}) => {
  const {price} = await http(config.requestManagerApiBaseUrl).get('gasPriceByPriority', {priority})
  const priceInEther = blockchain.web3.utils.fromWei(price, 'Ether')
  const toAddress = '0x0000000000000000000000000000000000000001'
  const value = '1'

  const estimatedEtherGas = await blockchain.web3.eth.estimateGas({
    to: toAddress,
    from,
    value,
  })
  const estimatedEtherCost = Big(estimatedEtherGas).times(priceInEther)

  const tokensCosts = await Promise.all(tokenAddresses.map(async (tokenAddress) => {
    const {encodedAbi} = await encodeAbiForSendPrize(toAddress, tokenAddress, value, from)
    const estimatedGas = await blockchain.web3.eth.estimateGas({
      to: tokenAddress,
      from,
      data: encodedAbi,
    })
    const estimatedCost = Big(estimatedGas).times(priceInEther)
    return {tokenAddress, estimatedCost}
  }))
  return {estimatedEtherCost, tokensCosts}
}

module.exports = {
  getLatestTransferTransactions,
  getAccountTokenBalance,
  estimateTokenTransfer,
}
