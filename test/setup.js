/* eslint-disable no-unused-vars */
process.env.NODE_ENV = 'test'

const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

// Chai Plugins
chai.use(sinonChai)

// globals
global.expect = chai.expect
global.sinon = sinon
global.chai = chai
