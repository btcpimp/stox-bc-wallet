const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  port: '',
  web3Url: '',
  databaseUrl: '',
  mqConnectionUrl: '',
  network: '',
  walletsPoolThreshold: '',
  smartWalletLibAddress: '',
  walletsCreatorAccount: '',
  defaultPrizeAccount: '',
})
