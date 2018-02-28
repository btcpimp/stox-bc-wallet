const {queue} = require('stox-common')
const tokensTransfers = require('../../../common/src/services/tokensTransfers')
const {network, tokenTransferCron, maxBlocksRead, requiredConfirmations} = require('../config')

module.exports = {
  cron: '*/5 * * * * *',
  job: async () => {
    const options = {network, tokenTransferCron, maxBlocksRead, requiredConfirmations}
    const transactions = await tokensTransfers(options)
  },
}
