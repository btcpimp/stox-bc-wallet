const {exceptions: {NotFoundError}} = require('@welldone-software/node-toolbelt')
const Sequelize = require('sequelize')
const db = require('app/db')

const {Op} = Sequelize

const createWallet = async () => db.wallet.create({address: new Date().getTime(), assignedAt: null})

const assignWallet = async () => {
  const wallet = await db.wallets.findOne({where: {assignedAt: {[Op.eq]: null}}})

  if (!wallet) {
    throw new NotFoundError('no wallets to assign')
  }

  wallet.update({assignedAt: new Date()})

  return wallet.address
}

module.exports = {
  createWallet,
  assignWallet,
}
