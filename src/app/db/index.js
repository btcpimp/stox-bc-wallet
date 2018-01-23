const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const models = require('./models')

const db = {}

const delay = (milliseconds, result) =>
  new Promise(resolve => setTimeout(resolve, milliseconds, result))

const connect = async (pgurl = null) => {
  logger.info('Initializing database connection...')

  if (db.sequelize) {
    throw new Error('Database already initialized.')
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
    logger.info('Retrying...')
    return dbInit(pgurl)
  }
}

db.dbInit = dbInit

module.exports = db
