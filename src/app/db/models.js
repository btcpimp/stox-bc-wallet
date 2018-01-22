const {DataTypes} = require('sequelize')

const {STRING, DATE, DECIMAL, INTEGER, JSON} = DataTypes
const AMOUNT = DECIMAL(36, 18)
const ADDRESS = STRING(42)
const TRANSACTION_HASH = STRING(66)

module.exports = (sequelize) => {
  const Network = sequelize.define(
    'networks',
    {
      name: {type: STRING, primaryKey: true},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  const Token = sequelize.define(
    'tokens',
    {
      name: {type: STRING, primaryKey: true},
      displayName: {type: STRING, allowNull: false},
      address: {type: ADDRESS, allowNull: false},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  const Wallet = sequelize.define(
    'wallets',
    {
      address: {type: ADDRESS, primaryKey: true},
      network: {type: STRING, allowNull: false},
      createdAt: {type: DATE, allowNull: false},
      assignedAt: {type: DATE},
    },
    {
      updatedAt: false,
      indexes: [
        {
          fields: ['network'],
        },
        {
          fields: ['assignedAt'],
        },
      ],
    }
  )

  const Balance = sequelize.define(
    'walletsBalance',
    {
      walletAddress: {type: ADDRESS, primaryKey: true},
      token: {type: ADDRESS, allowNull: false},
      balance: {type: AMOUNT, validate: {min: 0}, allowNull: false},
      updatedAt: {type: DATE},
    },
    {
      tableName: 'walletsBalance',
      createdAt: false,
    }
  )

  const Transaction = sequelize.define(
    'transactions',
    {
      address: {type: ADDRESS, primaryKey: true},
      transactionHash: {type: TRANSACTION_HASH, allowNull: false},
      transactionIndex: {type: INTEGER, defaultValue: 0},
      network: {type: STRING, allowNull: false},
      blockNumber: {type: INTEGER, defaultValue: 0, allowNull: false},
      from: {type: STRING, allowNull: false},
      to: {type: STRING, allowNull: false},
      amount: {type: AMOUNT, allowNull: false},
      rawData: {type: JSON},
    },
    {
      createdAt: false,
      updatedAt: false,
      indexes: [
        {
          fields: ['transactionHash'],
        },
      ],
    }
  )

  const TransactionsManagement = sequelize.define(
    'transactionsManagement',
    {
      token: {type: ADDRESS, primaryKey: true},
      lastReadBlock: {type: INTEGER, defaultValue: 0, allowNull: false},
    },
    {
      tableName: 'transactionsManagement',
      createdAt: false,
      updatedAt: false,
      indexes: [
        {
          fields: ['transactionHash'],
        },
      ],
    }
  )

  return sequelize
}
