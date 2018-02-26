const axios = require('axios')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {backendBaseUrl} = require('app/config')

const http = (() => {
  const ax = axios.create({
    baseURL: `${backendBaseUrl}/api/v1`,
    responseType: 'json',
  })
  return ['post', 'get', 'delete', 'put'].reduce((caller, method) => {
    caller[method] = (...args) =>
      ax[method](...args)
        .then(res => res.data)
        .catch((err) => {
          // Remove unused data
          const error = Object.assign(err, {config: undefined, request: undefined, response: err.response && err.response.data})
          return Promise.reject(new UnexpectedError('backend api failed', error))
        })
    return caller
  }, {})
})()

const sendTransactionMessage = message => http.post('/wallet/transaction', message)

module.exports = {
  sendTransactionMessage,
}
