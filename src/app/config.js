require('dotenv').config()

module.exports = {
  PORT: process.env.PORT,
  WEB3_URL: process.env.WEB3_URL || 'http://localhost:8545/',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:secret@localhost/stox2',
  requiredConfirmations: 12,
  maxBlocksRead: 0,
}
