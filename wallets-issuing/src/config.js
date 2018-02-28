const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  port: 3001,
  web3Url: '',
  databaseUrl: '',
  mqConnectionUrl: '',
  requiredConfirmations: 12,
  maxBlocksRead: 10000,
  network: '',
  tokenTransferCron: '*/20 * * * * *',
  mqConnectionUrl: '',
})
