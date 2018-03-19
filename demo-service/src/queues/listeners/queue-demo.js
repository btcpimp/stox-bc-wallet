const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

module.exports = async (message) => {
  logger.info({message}, 'SPAM')
}
