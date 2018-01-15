const Sequelize = require('sequelize')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const models = require('./models')


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

  models(sequelizeInstance)

  db.sequelize = sequelizeInstance

  Object.assign(db, sequelizeInstance.models)
}

db.dbInit = dbInit

module.exports = db
