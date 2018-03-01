const {loggers: {logger}, exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const {db} = require('stox-common')

const {Op} = Sequelize

const getUnassignedWalletsCount = async (network) => {
  const count = await db.wallets.count({
    where: {
      [Op.and]: [
        {assignedAt: {[Op.eq]: null}},
        {corruptedAt: {[Op.eq]: null}},
        {network: {[Op.eq]: network}},
      ],
    },
  })
  return {count}
}

module.exports = {
  getUnassignedWalletsCount,
}
