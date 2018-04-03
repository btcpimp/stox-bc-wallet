const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

module.exports = async ({body, headers}) => {
  logger.info({body, headers}, 'SPAM')
}
