module.exports = async (message) => {
  const {address} = message
  return await blockchain.getABI(address)
}