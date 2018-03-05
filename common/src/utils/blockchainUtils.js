const {web3, init} = require('../services/blockchain')
const {
  exceptions: {InvalidArgumentError, UnexpectedError},
  loggers: {logger},
} = require('@welldone-software/node-toolbelt')

const blockchainConfig = {
  web3Url: '',
  maxBlocksRead: 10000,
  requiredConfirmations: 12,
}

const initBlockchain = (web3Url, maxBlocksRead, requiredConfirmations) => {
  Object.assign(blockchainConfig, {web3Url, maxBlocksRead, requiredConfirmations})
  init(web3Url)
}

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

const getLastConfirmedBlock = async () => {
  const currentBlock = await web3.eth.getBlockNumber()
  return (currentBlock - blockchainConfig.requiredConfirmations)
}

const isListening = async () => {
  try {
    return await web3.eth.net.isListening()
  } catch (e) {
    logger.error(e)
    return false
  }
}

const getNextBlocksRange = async (lastReadBlockNumber) => {
  try {
    let fromBlock = lastReadBlockNumber !== 0 ? lastReadBlockNumber + 1 : 0
    const toBlock = await getLastConfirmedBlock()

    if ((toBlock - fromBlock) > blockchainConfig.maxBlocksRead) {
      fromBlock = toBlock - blockchainConfig.maxBlocksRead
      fromBlock = fromBlock < 0 ? fromBlock = 0 : fromBlock
    }

    return {
      fromBlock,
      toBlock,
    }
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

module.exports = {
  weiToEther,
  etherToWei,
  validateAddress,
  isAddressEmpty,
  isListening,
  getBlockData,
  getLastConfirmedBlock,
  getNextBlocksRange,
  initBlockchain,
}
