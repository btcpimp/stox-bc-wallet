const schedule = require('node-schedule')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {assignWith} = require('lodash')

const assignWithCustomizer = (objValue, srcValue) =>
  (objValue === undefined ? srcValue : objValue)

const errSerializer = err =>
  (err instanceof Error
    ? assignWith(
      {
        name: err.name || err.constructor.name,
        message: err.message,
        stack: err.stack,
        context: err.context,
      },
      err.original || err,
      assignWithCustomizer
    )
    : err)

const jobs = {}
const scheduleJob = async (name, spec, func) => {
  logger.info({name, spec}, 'STARTED')

  let promise = null
  const job = jobs[name]

  if (!job) {
    jobs[name] = schedule.scheduleJob(spec, async () => {
      if (!promise) {
        logger.info({name}, 'IN_CYCLE')

        promise = func()
          .then(() => {
            promise = null
          })
          .catch((e) => {
            const error = errSerializer(e)
            delete error.code
            logger.error(error)
            promise = null
          })
      }
    })
  }
}

const cancelJob = async (name) => {
  const job = jobs[name]

  if (job) {
    logger.info({name}, 'STOPPED')
    job.cancel()
  }
}

module.exports = {
  scheduleJob,
  cancelJob,
}
