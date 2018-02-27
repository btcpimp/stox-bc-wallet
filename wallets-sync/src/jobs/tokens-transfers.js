const {queue} = require('stox-common')
const {mqConnectionUrl} = require('../config')

module.exports = {
  cron: '*/5 * * * * *',
  job: async () => {
    const client = await queue.makeTaskProducer(mqConnectionUrl, 'create-wallet-request')
    client.send({helloMq: 'create-wallet-request consumer queue called from tokens-transfers job'})
  },
}
