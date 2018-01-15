const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  port: 3000,
  web3Url: 'http://localhost:8545/',
  databaseUrl: '',
  requiredConfirmations: 12,
  maxBlocksRead: 0,
})
