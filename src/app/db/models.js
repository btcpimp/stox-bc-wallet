const {DataTypes} = require('sequelize')

const {STRING, DATE, DECIMAL} = DataTypes
const STXAMOUNT = DECIMAL(36, 18)
const ETHEREUM_ADDRESS = STRING(42)

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
      lastReadBlockAddress: {type: ETHEREUM_ADDRESS, allowNull: false},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  sequelize.define(
    'eventLogs',
    {
      txHash: {type: ETHEREUM_ADDRESS, primaryKey: true},
      block: {type: ETHEREUM_ADDRESS, allowNull: false},
      token: {type: STRING, allowNull: false},
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
      token: {type: STRING, allowNull: false},
      balance: {type: STXAMOUNT, allowNull: false},
      createdAt: {type: DATE},
      assignedAt: {type: DATE},
    },
    {
      assignedAt: false,
      createdAt: false,
      updatedAt: false,
    }
  )

  return sequelize
}
