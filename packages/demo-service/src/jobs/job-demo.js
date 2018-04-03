const {context} = require('stox-bc-wallet-common')

module.exports = {
  cron: '*/5 * * * * *',
  job: async () => {
    context.mq.publish('queue-demo', {
      id: new Date().getTime(),
      type: 'createWallet',
    })

    context.mq.rpc('rpc-demo', {
      id: new Date().getTime(),
      type: 'createWallet-rpc',
    })
  },
}
