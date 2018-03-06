const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  web3Url: '',
  databaseUrl: '',
  mqConnectionUrl: '',
  requiredConfirmations: 0,
  maxBlocksRead: 0,
  network: '',
  tokensTransfersCron: '',
})
