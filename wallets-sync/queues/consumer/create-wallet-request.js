module.exports = async (message) => {
  const {requestData} = message
  const wallet = await blockchain.createWallet(requestData)
  await db.wallets.create(wallet)
}
