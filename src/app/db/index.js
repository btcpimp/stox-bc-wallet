const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const models = require('./models')

const db = {}

const delay = (milliseconds, result) =>
  new Promise(resolve => setTimeout(resolve, milliseconds, result))

const connect = async (pgurl = null) => {
  logger.info('initializing database connection...')

  if (db.sequelize) {
    throw new Error('database already initialized.')
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
  logger.info('database connection established successfully.')

  models(sequelizeInstance)

  db.sequelize = sequelizeInstance

  Object.assign(db, sequelizeInstance.models)
}

const dbInit = async (pgurl = null) => {
  try {
    return await connect(pgurl)
  } catch (error) {
    logger.error(error)
    await delay(30000)
    logger.info('retrying...')
    return dbInit(pgurl)
  }
}

db.dbInit = dbInit

module.exports = db
