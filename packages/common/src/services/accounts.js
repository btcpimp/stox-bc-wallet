const {getAccountTokenBalance} = require('./blockchain/tokenTracker')
const {blockchain} = require('../context')


const getAccountBalance = async ({accountAddress, tokenAddresses = []}) => {
  const ether = await blockchain.web3.eth.getBalance(accountAddress)
  const tokens = []
  await Promise.all(tokenAddresses.map(async (tokenAddress) => {
    const {balance} = await getAccountTokenBalance(accountAddress, tokenAddress)
    const tokenBalance = {}
    tokenBalance.tokenAddress = tokenAddress
    tokenBalance.balance = balance
    tokens.push(tokenBalance)
  }))
  return {ether: blockchain.web3.utils.fromWei(ether, 'ether'), tokens}
}

module.exports = {
  getAccountBalance,

}
