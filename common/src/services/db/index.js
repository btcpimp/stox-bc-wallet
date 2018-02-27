const tokensTransfersReads = require('./db/tokensTransfersReads')
const tokensTransfers = require('./db/tokensTransfers')
const tokensBalances = require('./db/tokensBalances')
const tokens = require('./db/tokens')
const wallets = require('./db/tokens')

module.export = {
  tokensTransfersReads,
  tokensTransfers,
  tokensBalances,
  tokens,
  wallets,
}