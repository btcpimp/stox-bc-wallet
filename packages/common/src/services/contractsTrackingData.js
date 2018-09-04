const {db, config} = require('../context')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {getLastConfirmedBlock} = require('../utils/blockchain')

const fetchLastReadBlock = async (contractId) => {
  const row = await db.contractsTrackingData.findOne({
    attributes: ['lastReadBlockNumber'],
    where: {contractId},
  })
  return row ? Number(row.lastReadBlockNumber) : 0
}

const updateLastReadBlock = (contractId, lastReadBlockNumber, dbTransaction) =>
  db.contractsTrackingData.upsert({contractId, lastReadBlockNumber}, {transaction: dbTransaction})

const getNextBlocksRange = async (contractId) => {
  const lastReadBlock = await fetchLastReadBlock(contractId)
  try {
    let fromBlock = lastReadBlock !== 0 ? lastReadBlock + 1 : 0
    const toBlock = await getLastConfirmedBlock()

    if (toBlock - fromBlock > config.maxBlocksRead) {
      fromBlock = toBlock - config.maxBlocksRead
      fromBlock = fromBlock < 0 ? 0 : fromBlock
    }

    return {
      fromBlock,
      toBlock,
    }
  } catch (e) {
    throw new UnexpectedError(`blockchain read failed, ${e.message}`, e)
  }
}

module.exports = {
  updateLastReadBlock,
  getNextBlocksRange,
}
