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

const isAddressEmpty = address => (address === '0x0000000000000000000000000000000000000000')

module.exports = {
  weiToEther,
  etherToWei,
  validateAddress,
  isAddressEmpty
}
