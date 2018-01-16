const {DataTypes} = require('sequelize')

const {STRING, DATE, DECIMAL, INTEGER, UUID} = DataTypes
const STXAMOUNT = DECIMAL(36, 18)
const ETHEREUM_ADDRESS = STRING(42)
const TRANSACTION_HASH = STRING(66)

const isValidAmount = (value) => {
  if (value >= 0.000000000000000001) {
    return true
  }
  throw new Error('amountInvalid')
}

module.exports = (sequelize) => {
  sequelize.define(
    'token',
    {
      address: {type: ETHEREUM_ADDRESS, primaryKey: true},
      name: {type: STRING, allowNull: false},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  sequelize.define(
    'eventLogsSettings',
    {
      tokenAddress: {type: ETHEREUM_ADDRESS, primaryKey: true},
      lastReadBlock: {type: INTEGER, defaultValue: 0, allowNull: false},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  sequelize.define(
    'eventLogs',
    {
      transactionHash: {type: TRANSACTION_HASH, primaryKey: true},
      blockNumber: {type: INTEGER, defaultValue: 0, allowNull: false},
      tokenAddress: {type: ETHEREUM_ADDRESS, allowNull: false},
      from: {type: STRING, allowNull: false},
      to: {type: STRING, allowNull: false},
      amount: {type: STXAMOUNT, allowNull: false, validate: {isValidAmount}},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  sequelize.define(
    'wallet',
    {
      address: {type: ETHEREUM_ADDRESS, primaryKey: true},
      userId: {type: UUID, primaryKey: true},
      createdAt: {type: DATE, allowNull: false},
      assignedAt: {type: DATE},
    },
    {
      updatedAt: false,
    }
  )

  sequelize.define(
    'walletBalance',
    {
      address: {type: ETHEREUM_ADDRESS, primaryKey: true},
      tokenAddress: {type: ETHEREUM_ADDRESS, allowNull: false},
      balance: {type: STXAMOUNT, validate: {min: 0}, allowNull: false},
      updatedAt: {type: DATE},
    },
    {
      createdAt: false,
    }
  )

  return sequelize
}
