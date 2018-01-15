const storage = require('node-persist')
const {web3} = require('./services/blockchain')
const {
  exceptions: {InvalidArgumentError},
} = require('@welldone-software/node-toolbelt')

const weiToEther = wei => web3.utils.fromWei(wei.toString(), 'ether')
const etherToWei = ether => web3.utils.toWei(ether.toString(), 'ether')

const validateAddress = (address) => {
  if (!web3.utils.isAddress(address)) {
    throw new InvalidArgumentError(`Invalid address ${address}`)
  }
}

const getStorageItemSync = (key, defaultItem) => {
  const item = storage.getItemSync(key)
  return item === undefined ? defaultItem : item
}

const setStorageItemSync = (key, value) => {
  storage.setItemSync(key, value)
}

module.exports = {
  weiToEther,
  etherToWei,
  validateAddress,
  getStorageItemSync,
  setStorageItemSync,
}
