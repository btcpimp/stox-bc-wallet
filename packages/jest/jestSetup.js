// const chai = require('chai')
// const chaiShallowDeepEqual = require('chai-shallow-deep-equal')
// const chaiJestDiff = require('chai-jest-diff').default
//
// chai.use(chaiShallowDeepEqual)
// chai.use(chaiJestDiff())
//
// global.assert = chai.assert
// global.expect = chai.expect
// global.jestExpect = global.expect

global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
