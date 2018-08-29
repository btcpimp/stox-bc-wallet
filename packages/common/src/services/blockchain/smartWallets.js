const {validateAddress, tokenDecimalsToWei, isAddressEmpty} = require('../../utils/blockchain')
const {blockchain, config} = require('../../context')
const solc = require('solc')
const {exceptions: {InvalidArgumentError}} = require('@welldone-software/node-toolbelt')

const getSmartWalletContract = async (walletAddress) => {
  const version = walletAddress ?
    (await require('../wallets').getWalletByAddress(walletAddress)).version :
    config.currentWalletVersion
  return blockchain[`getSmartWalletV${version}Contract`](walletAddress)
}

const getOperatorAccount = async wallet => (await wallet.methods.wallet().call()).operatorAccount

const encodeAbiForSetWithdrawalAddress = async (walletAddress, userWithdrawalAddress) => {
  validateAddress(walletAddress)
  validateAddress(userWithdrawalAddress)

  const wallet = await getSmartWalletContract(walletAddress)
  const fromAccount = await getOperatorAccount(wallet)
  const encodedAbi = wallet.methods.setUserWithdrawalAccount(userWithdrawalAddress).encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForWithdraw = async (walletAddress, tokenAddress, amount) => {
  const {feeTokenAddress, fee} = config
  validateAddress(walletAddress)
  validateAddress(tokenAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  if (fee < 0) {
    throw new InvalidArgumentError(`Fee must be greater or equal to 0. Fee is ${fee}`)
  } else if (fee > 0) {
    validateAddress(feeTokenAddress)
  }

  const wallet = await getSmartWalletContract(walletAddress)
  const fromAccount = await getOperatorAccount(wallet)
  const encodedAbi = wallet.methods.transferToUserWithdrawalAccount(
    tokenAddress,
    await tokenDecimalsToWei({amount, tokenAddress}),
    feeTokenAddress,
    await tokenDecimalsToWei({amount: fee, tokenAddress: feeTokenAddress})
  ).encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForTransferToBackup = async (walletAddress, tokenAddress, amount) => {
  validateAddress(walletAddress)
  validateAddress(tokenAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  const wallet = await getSmartWalletContract(walletAddress)
  const fromAccount = await getOperatorAccount(wallet)
  const amountInWei = await tokenDecimalsToWei({amount, tokenAddress})
  const encodedAbi = wallet.methods.transferToBackupAccount(tokenAddress, amountInWei).encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForCreateWallet = async () => {
  const fromAccount = config.walletsCreatorAccount
  const bytecode =
    await solc.linkBytecode(blockchain.getSmartWalletContractBin(), {':SmartWalletLib': config.smartWalletLibAddress})
  const encodedAbi = (await getSmartWalletContract())
    .deploy({
      data: bytecode,
      arguments: [config.smartWalletsOperatorAccount, config.smartWalletsFeesAccount],
    })
    .encodeABI()

  return {fromAccount, encodedAbi}
}

const encodeAbiForSendPrize = async (
  prizeReceiverAddress,
  tokenAddress,
  amount,
  prizeDistributorAddress = config.defaultPrizeAccount
) => {
  validateAddress(prizeReceiverAddress)
  validateAddress(tokenAddress)
  validateAddress(prizeDistributorAddress)

  if (amount <= 0) {
    throw new InvalidArgumentError(`Amount must be greater than 0. Amount is ${amount}`)
  }

  const token = blockchain.getERC20TokenContract(tokenAddress)
  const amountInWei = await tokenDecimalsToWei({amount, tokenAddress})
  const encodedAbi = token.methods.transfer(prizeReceiverAddress, amountInWei).encodeABI()

  return {fromAccount: prizeDistributorAddress, encodedAbi}
}

const getWalletProperties = async (walletAddress) => {
  validateAddress(walletAddress)

  const wallet = await getSmartWalletContract(walletAddress)
  return wallet.methods.wallet().call()
}


const getWithdrawalAddress = async (walletAddress) => {
  const {userWithdrawalAccount} = await getWalletProperties(walletAddress)
  return userWithdrawalAccount
}

const encodeAbiForSendExternalPrize = async (
  userStoxWalletAddress,
  tokenAddress,
  amount,
  prizeDistributorAddress = config.defaultPrizeAccount
) => {
  const prizeReceiverAddress = await getWithdrawalAddress(userStoxWalletAddress)
  return encodeAbiForSendPrize(
    prizeReceiverAddress,
    tokenAddress,
    amount,
    prizeDistributorAddress
  )
}

const isWalletAssignedOnBlockchain = async address => !(isAddressEmpty(await getWithdrawalAddress(address)))

module.exports = {
  isWalletAssignedOnBlockchain,
  encodeAbiForSetWithdrawalAddress,
  encodeAbiForWithdraw,
  encodeAbiForTransferToBackup,
  encodeAbiForCreateWallet,
  encodeAbiForSendPrize,
  encodeAbiForSendExternalPrize,
  getWithdrawalAddress,
  getWalletProperties,
}
