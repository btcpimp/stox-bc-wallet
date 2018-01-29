const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  port: 3001,
  web3Url: 'http://10.250.2.207:8545/',
  databaseUrl: 'postgres://postgres:secret@bc_wallet_db/stox2',
  requiredConfirmations: 12,
  maxBlocksRead: 10000,
  network: '',
  tokenTransferCron: '1 * * * * *', // cron syntax,
  updateBalanceCron: '1 * * * * *', // cron syntax,
  maxWalletAssignRetires: 5,
})
