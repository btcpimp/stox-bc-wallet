require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {start} = require('stox-bc-wallet-common')

start(__dirname, require('config'))
