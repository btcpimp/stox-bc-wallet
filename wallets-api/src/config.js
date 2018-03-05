const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  port: 3000,
  databaseUrl: '',
  web3Url: '',
  maxBlocksRead: 10000,
  requiredConfirmation: 12,
  network: '',
})
