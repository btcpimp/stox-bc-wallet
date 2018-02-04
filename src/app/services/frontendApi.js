const axios = require('axios')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {frontendBaseUrl} = require('../config')

const http = (() => {
  const ax = axios.create({
    baseURL: frontendBaseUrl,
    responseType: 'json',
  })
  return ['post', 'get', 'delete', 'put'].reduce((caller, method) => {
    caller[method] = (...args) =>
      ax[method](...args)
        .then(res => res.data)
        .catch(err => Promise.reject(new UnexpectedError('frontend failed', err)))
    return caller
  }, {})
})()

const sendTransactionMessage = message => http.post('/wallet/transaction', message)

module.exports = {
  sendTransactionMessage,
}
