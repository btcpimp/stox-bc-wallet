const {queue} = require('stox-common')
const tokensTransfers = require('../services/tokensTransfers')

module.exports = {
  cron: '*/5 * * * * *',
  job: tokensTransfers,
}
