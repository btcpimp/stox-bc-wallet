const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = {
  port: 3000,
  web3Url: 'http://localhost:8545/',
  databaseUrl: 'postgres://postgres:secret@localhost/stox2',
  requiredConfirmations: 12,
  maxBlocksRead: 0,
}
