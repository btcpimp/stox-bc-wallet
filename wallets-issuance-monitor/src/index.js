require('app-module-path').addPath(__dirname)
const {createServiceFromFileStructure} = require('stox-common')
const config = require('config')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {initContext} = require('stox-bc-wallet-common')

createServiceFromFileStructure(__dirname, {name: 'wallets-issuance-monitor'})
  .then(context => initContext({...context, config}))
  .catch(e => logger.error(e))
