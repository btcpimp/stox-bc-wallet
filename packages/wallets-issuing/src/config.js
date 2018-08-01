const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  databaseUrl: '',
  mqConnectionUrl: '',
  requestManagerApiBaseUrl: '',
  network: '',
  walletsPoolCron: '',
  walletsPoolThreshold: '',
})
