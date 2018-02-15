const {web3} = require('./services/blockchain')
const {
  exceptions: {InvalidArgumentError},
  loggers: {logger},
} = require('@welldone-software/node-toolbelt')

const weiToEther = wei => web3.utils.fromWei(wei.toString(), 'ether')

const etherToWei = ether => web3.utils.toWei(ether.toString(), 'ether')

const secondsToDate = date => new Date(date * 1000)

const validateAddress = (address) => {
  if (!web3.utils.isAddress(address)) {
    throw new InvalidArgumentError(`invalid address ${address}`)
  }
}

const isAddressEmpty = address => (address === '0x0000000000000000000000000000000000000000')

const getBlockData = async (blockNumber = 'latest') => {
  const block = await web3.eth.getBlock(blockNumber, false)
  return {blockNumber: block.number, timestamp: secondsToDate(block.timestamp)}
}

const isListening = async () => {
  try {
    return await web3.eth.net.isListening()
  } catch (e) {
    logger.error(e)
    return false
  }
}

module.exports = {
  weiToEther,
  etherToWei,
  validateAddress,
  isAddressEmpty,
  isListening,
  getBlockData,
}
