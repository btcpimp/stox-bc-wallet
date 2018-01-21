const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  port: 3001,
  web3Url: 'http://10.250.2.207:8545/',
  databaseUrl: 'postgres://postgres:secret@stox_postgress/stox2',
  requiredConfirmations: 12,
  maxBlocksRead: 10000,
})
