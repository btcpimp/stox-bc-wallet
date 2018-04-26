const path = require('path')
const URI = require('urijs')
const {Pact} = require('@pact-foundation/pact')
const {requestManagerApiBaseUrl} = require('../../config')

const port = new URI(requestManagerApiBaseUrl).port()

const provider = new Pact({
  port: Number(port),
  spec: 2,
  pactfileWriteMode: 'update',
  consumer: 'wallet-issuing',
  provider: 'wallets-api',
  log: path.resolve('./src/tests/logs', 'mockserver-integration.log'),
  dir: path.resolve('./src/tests/pacts'),
  logLevel: 'error',
})

const createInteraction = ({count}) =>
  provider.addInteraction({
    uponReceiving: 'a request for getting pending wallet requests',
    withRequest: {
      method: 'GET',
      path: '/api/v1/requests/createWallet/count/pending',
      headers: {Accept: 'application/json, text/plain, */*'},
    },
    willRespondWith: {
      status: 200,
      headers: {'Content-Type': 'application/json'},
      body: {count},
    },
  })

module.exports = {
  provider,
  createInteraction,
}
