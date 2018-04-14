const {provider, createInteraction} = require('../pacts/requestManagerApi')
const uuid = require('uuid')
const {initContext, context, models} = require('stox-bc-wallet-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {range} = require('lodash')
const {createService} = require('stox-common')
const {job} = require('../../jobs/walletsPool')
const config = require('../../config')

const {databaseUrl, walletsPoolThreshold, network} = config
const walletThreshHoldNumber = Number(walletsPoolThreshold)

const createWallets = (numberOfWallets, assignedAt) =>
  range(numberOfWallets).map(() => {
    const address = uuid()
      .toString()
      .substring(0, 42)
    return {
      id: `${network}.${address}`,
      address,
      network,
      assignedAt,
      version: 1,
    }
  })

const createTest = async ({
  wallets,
  initialNumberOfPendingRequests,
  expectedNumberOfCallsToQueue,
  expectedNumberOfPendingRequests,
}) => {
  // prepare
  if (wallets) {
    await context.db.wallets.bulkCreate(wallets)
  }
  await context.db.pendingRequests.create({type: 'createWallet', count: initialNumberOfPendingRequests})
  await createInteraction({count: 0})

  // act
  await job()
  const {count: currentPendingRequest} = await context.db.pendingRequests.findOne({where: {type: 'createWallet'}})

  // assert
  expect(currentPendingRequest).toBe(expectedNumberOfPendingRequests)

  if (expectedNumberOfCallsToQueue) {
    expect(context.mq.publish).toHaveBeenCalledTimes(expectedNumberOfCallsToQueue)
  } else {
    expect(context.mq.publish).not.toHaveBeenCalled()
  }
}

describe('wallet pool tests', () => {
  beforeAll(async (done) => {
    const ctx = await createService('wallet-issuing-tests', builder => builder.db(databaseUrl, models))
    initContext({...ctx, config}, context)
    context.logger = logger
    context.mq.publish = jest.fn()
    await provider.setup()
    setTimeout(() => done(), 3000)
  })

  afterEach(async (done) => {
    await context.db.pendingRequests.destroy({where: {}})
    await context.db.wallets.destroy({where: {}})
    await provider.verify()
    context.mq.publish.mockClear()
    done()
  })

  afterAll(async (done) => {
    await provider.finalize()
    done()
  })

  it(
    'should add pending request to db to meet ' +
      'the required thresh hold and send request on queue to replenish wallets ',
    async () => {
      const pendingCount = Math.round(walletThreshHoldNumber / 2)
      await createTest({
        initialNumberOfPendingRequests: pendingCount,
        expectedNumberOfCallsToQueue: walletThreshHoldNumber - pendingCount,
        expectedNumberOfPendingRequests: walletThreshHoldNumber,
      })
    }
  )

  it(
    'should not send any wallet request and not' +
      ' add to pending request when enough wallets are assigned and no pending requests',
    () =>
      createTest({
        wallets: createWallets(walletThreshHoldNumber + 1),
        initialNumberOfPendingRequests: 0,
        expectedNumberOfCallsToQueue: 0,
        expectedNumberOfPendingRequests: 0,
      })
  )

  it(
    'should send wallet requests and add to pending request when not enough wallets are unassigned' +
      ' and not enough pending request combine meets the thresh hold',
    async () => {
      const numberOfUnAlignedWallets = Math.round(walletThreshHoldNumber / 4)
      const numberOfPendingRequests = Math.round(walletThreshHoldNumber / 4)
      const expectedNumberOfCallsToQueue = walletThreshHoldNumber - numberOfPendingRequests - numberOfUnAlignedWallets
      const expectedNumberOfPendingRequests = walletThreshHoldNumber - numberOfUnAlignedWallets

      await createTest({
        wallets: createWallets(numberOfUnAlignedWallets),
        initialNumberOfPendingRequests: numberOfPendingRequests,
        expectedNumberOfCallsToQueue,
        expectedNumberOfPendingRequests,
      })
    }
  )

  it('should not add send requests for assigned wallets ', async () => {
    const numberOfAssingedWallets = Math.round(walletThreshHoldNumber / 4)
    const initialNumberOfPendingRequests = Math.round(walletThreshHoldNumber / 4)
    const expectedNumberOfCallsToQueue = walletThreshHoldNumber - initialNumberOfPendingRequests
    await createTest({
      wallets: createWallets(numberOfAssingedWallets, new Date()),
      initialNumberOfPendingRequests,
      expectedNumberOfCallsToQueue,
      expectedNumberOfPendingRequests: walletThreshHoldNumber,
    })
  })
})
