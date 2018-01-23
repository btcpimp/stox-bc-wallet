const {DataTypes} = require('sequelize')

const {STRING, DATE, DECIMAL, INTEGER, BIGINT, JSON} = DataTypes
const AMOUNT = DECIMAL(36, 18)
const ADDRESS = STRING(42)
const TRANSACTION_HASH = STRING(66)

module.exports = (sequelize) => {
  sequelize.define(
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

  sequelize.define(
    'wallets',
    {
      id: {type: STRING(256), primaryKey: true},
      address: {type: ADDRESS, allowNull: false},
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

  sequelize.define(
    'tokensBalances',
    {
      walletId: {type: STRING(256), allowNull: false, references: {model: 'wallets', key: 'id'}},
      tokenId: {type: STRING(256), allowNull: false, references: {model: 'tokens', key: 'id'}},
      balance: {type: AMOUNT, validate: {min: 0}, allowNull: false},
      createdAt: {type: DATE, allowNull: false},
      updatedAt: {type: DATE, allowNull: false},
    },
    {
      createdAt: false,
    }
  )

  sequelize.define(
    'transactions',
    {
      id: {type: INTEGER, primaryKey: true, autoIncrement: true},
      transactionHash: {type: TRANSACTION_HASH, primaryKey: true},
      transactionIndex: {type: INTEGER, defaultValue: 0, primaryKey: true},
      tokenId: {type: STRING(256), allowNull: false, references: {model: 'tokens', key: 'id'}},
      address: {type: ADDRESS, primaryKey: true},
      network: {type: STRING, allowNull: false},
      blockNumber: {type: BIGINT, defaultValue: 0, allowNull: false},
      fromAddress: {type: ADDRESS, allowNull: false},
      toAddress: {type: ADDRESS, allowNull: false},
      amount: {type: AMOUNT, allowNull: false},
      createdAt: {type: DATE, allowNull: false},
      rawData: {type: JSON},
    },
    {
      updatedAt: false,
    }
  )

  sequelize.define(
    'transactionsReads',
    {
      tokenId: {type: STRING(256), primaryKey: true, references: {model: 'tokens', key: 'id'}},
      lastReadBlockNumber: {type: BIGINT, defaultValue: 0, allowNull: false},
    },
    {
      createdAt: false,
      updatedAt: false,
    }
  )

  return sequelize
}
