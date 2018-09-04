const {DataTypes} = require('sequelize')

const {STRING, DATE, DECIMAL, SMALLINT, INTEGER, BIGINT, JSON} = DataTypes
const AMOUNT = DECIMAL(36, 18)
const ADDRESS = STRING(42)
const TRANSACTION_HASH = STRING(66)

module.exports = (sequelize) => {
  const Token = sequelize.define(
    'tokens',
    {
      id: {type: STRING(256), primaryKey: true},
      name: {type: STRING(256), allowNull: false},
      address: {type: ADDRESS, allowNull: false},
      network: {type: STRING, allowNull: false},
      createdAt: {type: DATE, allowNull: false},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  const Wallet = sequelize.define(
    'wallets',
    {
      id: {type: STRING(256), primaryKey: true},
      address: {type: ADDRESS, allowNull: false},
      network: {type: STRING, allowNull: false},
      createdAt: {type: DATE, allowNull: false},
      assignedAt: {type: DATE},
      setWithdrawAddressAt: {type: DATE},
      corruptedAt: {type: DATE},
      version: {type: SMALLINT, allowNull: false},
      updatedAt: {type: DATE, allowNull: false},
      selfWithdrawRequestedAt: {type: DATE},
      selfWithdrawAllowedAt: {type: DATE},
    },
    {
      indexes: [
        {
          fields: ['network'],
        },
        {
          fields: ['updatedAt'],
        },
      ],
    }
  )

  const TokensBalance = sequelize.define('tokensBalances', {
    walletId: {type: STRING(256), primaryKey: true, references: {model: 'wallets', key: 'id'}},
    tokenId: {type: STRING(256), primaryKey: true, references: {model: 'tokens', key: 'id'}},
    balance: {type: AMOUNT, validate: {min: 0}, allowNull: false},
    createdAt: {type: DATE, allowNull: false},
    updatedAt: {type: DATE, allowNull: false},
    pendingUpdateBalance: {type: SMALLINT, allowNull: false},
  })
  TokensBalance.belongsTo(Wallet)
  Wallet.hasMany(TokensBalance)
  TokensBalance.belongsTo(Token)
  Token.hasMany(TokensBalance)

  const TokenTransfer = sequelize.define(
    'tokensTransfers',
    {
      blockNumber: {type: BIGINT, defaultValue: 0, primaryKey: true},
      logIndex: {type: INTEGER, defaultValue: 0, primaryKey: true},
      transactionHash: {type: TRANSACTION_HASH, allowNull: false},
      tokenId: {type: STRING(256), allowNull: false, references: {model: 'tokens', key: 'id'}},
      network: {type: STRING, allowNull: false},
      fromAddress: {type: ADDRESS, allowNull: false},
      toAddress: {type: ADDRESS, allowNull: false},
      currentBlockTime: {type: DATE},
      amount: {type: AMOUNT, allowNull: false},
      createdAt: {type: DATE, allowNull: false},
      rawData: {type: JSON},
    },
    {
      updatedAt: false,
    }
  )
  TokenTransfer.belongsTo(Token)
  Token.hasMany(TokenTransfer)

  sequelize.define(
    'contractsTrackingData',
    {
      contractId: {type: STRING(256), primaryKey: true},
      lastReadBlockNumber: {type: BIGINT, defaultValue: 0, allowNull: false},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  sequelize.define(
    'pendingRequests',
    {
      type: {type: STRING(30), primaryKey: true},
      count: {type: INTEGER, defaultValue: 0, allowNull: false},
    },
    {
      createdAt: false,
    }
  )

  return sequelize
}
