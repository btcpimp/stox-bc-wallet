const Sequelize = require('sequelize')
const {
  exceptions: {
    InvalidArgumentError,
    NotFoundError,
  },
  loggers: {logger},
} = require('@welldone-software/node-toolbelt')
const db = require('app/db')

// TODO: create indexes

const getUnassignedWallet = async () => db.wallet.findOne({where: {assignedAt: null}})

const createWallet = async () => db.wallet.create({address: new Date().getTime(), assignedAt: null})

const assignWallet = async (address) => {
  if (!address) {
    throw new InvalidArgumentError('address cannot be empty')
  }

  const wallet = await db.wallet.findOne({where: {address}})

  if (!wallet) {
    throw new NotFoundError('no wallets to assign')
  }

  if (wallet.assignedAt) {
    throw new InvalidArgumentError('wallet is already assgined')
  }

  wallet.update({assignedAt: new Date()})
}

module.exports = {
  getUnassignedWallet,
  createWallet,
  assignWallet,
}

