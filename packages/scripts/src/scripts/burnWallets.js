
const {http, errors: {logError}} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {
  context: {db, mq, config},
  services: {blockchain: {smartWallets: {getWithdrawalAddress}}},
  utils: {blockchain: {isAddressEmpty}},
} = require('stox-bc-wallet-common')
const moment = require('moment')
const uuid = require('uuid')
const promiseSerial = require('promise-serial')

const getWithdrawalAddressFromServer = depositAddress =>
  http(config.backendBaseUrl).get('/wallet/withdrawAddressByDepositAddress', {
    depositAddress,
    network: 'MAIN',
  })

const sendAssignRequest = (wallet, withdrawAddress) => {
  mq.publish('incoming-requests', {
    id: uuid(),
    data: {walletAddress: wallet.address, userWithdrawalAddress: withdrawAddress},
    type: 'setWithdrawalAddress',
  })
}

const burnWallets = async () => {
  let countMarkAsBurn = 0
  let countSentRequest = 0

  const walletsToBurn = await db.wallets.findAll({
    include: {model: db.tokensBalances, where: {balance: {$gt: 0}}},
    where: {
      assignedAt: {$and: {$ne: null, $lt: moment().subtract(3, 'days').format()}},
      setWithdrawAddressAt: null,
      corruptedAt: null,
    },
  })
  // 1618

  promiseSerial(walletsToBurn.map(wallet => async () => {
    try {
      const isWalletUnassignedOnBlockchain = isAddressEmpty(await getWithdrawalAddress(wallet.address))
      if (!isWalletUnassignedOnBlockchain) {
        await wallet.update({setWithdrawAddressAt: new Date()})
        countMarkAsBurn += 1
        logger.info({countMarkAsBurn, address: wallet.address}, 'walletMarkedAsBurned')
      } else {
        const withdrawAddress = await getWithdrawalAddressFromServer(wallet.address)
        sendAssignRequest(wallet, withdrawAddress)
        countSentRequest += 1
        logger.info({countSentRequest, address: wallet.address}, 'burnRequestSent')
      }
    } catch (e) {
      logError({e, address: wallet.address}, 'burn error')
    }
  })).then(() => {
    logger.info({countSentRequest, countMarkAsBurn}, 'Done')
    process.exit()
  })
}

module.exports = burnWallets

