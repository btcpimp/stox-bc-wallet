const {exceptions: {InvalidArgumentError}} = require('@welldone-software/node-toolbelt')
const context = require('../context')
const {Big} = require('big.js')

const {blockchain, config} = context

const getDecimalsByToken = async (tokenAddress) => {
  const token = blockchain.getERC20TokenContract(tokenAddress)
  return token.methods.decimals().call()
}

const tokenDecimalsToWei = async ({amount: amountDecimals, decimals, tokenAddress}) => {
  if (!decimals) {
    decimals = await getDecimalsByToken(tokenAddress)
  }
  return Big(amountDecimals).times(Big(10 ** decimals)).toFixed()
}

const tokenWeiToDecimals = async ({amount: amountWei, decimals, tokenAddress}) => {
  if (!decimals) {
    decimals = await getDecimalsByToken(tokenAddress)
  }
  return Big(amountWei).div(Big(10 ** decimals)).toFixed()
}


const secondsToDate = date => new Date(date * 1000)

const validateAddress = (address) => {
  if (!blockchain.web3.utils.isAddress(address)) {
    throw new InvalidArgumentError(`invalid address ${address}`)
  }
}

const isAddressEmpty = address => address === '0x0000000000000000000000000000000000000000'

const getBlockData = async (blockNumber = 'latest') => {
  const block = await blockchain.web3.eth.getBlock(blockNumber, false)
  return {blockNumber: block.number, timestamp: secondsToDate(block.timestamp)}
}

const getLastConfirmedBlock = async () => {
  const currentBlock = await blockchain.web3.eth.getBlockNumber()
  return currentBlock - config.requiredConfirmations
}

const isListening = async () => {
  try {
    return await blockchain.web3.eth.net.isListening()
  } catch (e) {
    context.logger.error(e)
    return false
  }
}

module.exports = {
  tokenDecimalsToWei,
  tokenWeiToDecimals,
  getDecimalsByToken,
  validateAddress,
  isAddressEmpty,
  isListening,
  getBlockData,
  getLastConfirmedBlock,
}
