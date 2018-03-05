const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  web3Url: '',
  databaseUrl: '',
  mqConnectionUrl: '',
  requiredConfirmations: 12,
  maxBlocksRead: 10000,
  network: '',
})
