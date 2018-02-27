const {mq} = require('stox-common')
const tokensTransfers = require('../../common/services/tokensTransfers')
const {network, tokenTransferCron, maxBlocksRead, requiredConfirmations} = require('../config')

module.exports = {
  cron: '*/5 * * * *',
  job: async () => {
    const options = {network, tokenTransferCron, maxBlocksRead, requiredConfirmations}
    const transactions = await tokensTransfers.fetchTransactions(options)
    await mq.sendMessageToQueue('backend-server/imcomming-transactions', transactions)
  },
}
