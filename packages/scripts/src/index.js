require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {start} = require('stox-bc-wallet-common')
const {
  burnWallets,
} = require('./scripts')

const scriptToRun = () =>
  burnWallets()

start(__dirname, require('config')).then(scriptToRun)

