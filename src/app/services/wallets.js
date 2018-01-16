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

const getWallet = async userId => db.wallet.findOne({where: {userId}})

const createWallet = async () => db.wallet.create({address: new Date().getTime(), assignedAt: null})

const assignWallet = async (userId) => {
  if (!userId) {
    throw new InvalidArgumentError('userId cannot be empty')
  }

  // TODO: validate user has no wallet

  const wallet = await db.wallet.findOne({
    where: {
      assignedAt: null,
    },
  })

  if (!wallet) {
    throw new NotFoundError('no wallets to assign')
  }

  db.wallet.update(
    {
      userId,
      assignedAt: new Date(),
    },
    {
      where: {
        address: wallet.address,
      },
    },
  )

  return wallet.address
}

module.exports = {
  getWallet,
  createWallet,
  assignWallet,
}

