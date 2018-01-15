const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {DataTypes} = require('sequelize')

const {STRING, DATE, DECIMAL, UUIDV4} = DataTypes
const STXAMOUNT = DECIMAL(36, 18)
const ETHEREUM_ADDRESS = STRING(42)
const db = {}

const dbInit = async (pgurl = null) => {
  if (db.sequelize) {
    throw new Error('Already initialized')
  }

  const sequelizeInstance = new Sequelize(pgurl, {
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  })

  await sequelizeInstance.authenticate()
  logger.info('Database connection established successfully.')

  // models

  const Wallet = sequelizeInstance.define(
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
      updatedAt: false
    }
  )

  const EventLog = sequelizeInstance.define(
    'eventsLog',
    {
      txHash: {type: ETHEREUM_ADDRESS, primaryKey: true},
      block: {type: ETHEREUM_ADDRESS, allowNull: false},
      token: {type: STRING, allowNull: false},
      from: {type: STRING, allowNull: false},
      to: {type: STRING, allowNull: false},
      amount: {type: STXAMOUNT, allowNull: false},
    }
  )

  db.sequelize = sequelizeInstance

  Object.assign(db, sequelizeInstance.models)
}

db.dbInit = dbInit

module.exports = db
