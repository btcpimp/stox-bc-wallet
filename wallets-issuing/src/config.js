const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  databaseUrl: '',
  mqConnectionUrl: '',
  network: '',
  walletPoolCron: '*/30 * * * * *',
  walletsPoolThreshold: 500,
})
