const {exceptions: {InvalidArgumentError, NotFoundError}} = require('@welldone-software/node-toolbelt')
const db = require('app/db')

const createWallet = async () => db.wallet.create({address: new Date().getTime(), assignedAt: null})

const assignWallet = async () => {
  const wallet = await db.wallet.findOne({where: {assignedAt: null}})

  if (!wallet) {
    throw new NotFoundError('no wallets to assign')
  }

  if (wallet.assignedAt) {
    throw new InvalidArgumentError('wallet is already assgined')
  }

  wallet.update({assignedAt: new Date()})

  return wallet.address
}

module.exports = {
  createWallet,
  assignWallet,
}
