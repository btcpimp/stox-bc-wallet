const schedule = require('node-schedule')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

const jobs = {}
const scheduleJob = async (name, spec, func) => {
  logger.info({name}, 'STARTED')

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
            if (e.original) {
              logger.error(e, e.original.message)
            } else {
              logger.error(e)
            }

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
