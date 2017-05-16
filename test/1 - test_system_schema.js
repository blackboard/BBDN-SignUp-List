/* global describe, it, after */
'use strict'
var assert = require('assert') // core module

var System = require('../controllers/models/systems')
var systemAPI = require('../controllers/routes/systems.js')
var chai = require('chai')
var expect = chai.expect
var chaiHttp = require('chai-http')
var server = require('../server')
var should = chai.should()
var config = require('../config/config')
var mongoose = require('mongoose')
const uuid = require('uuid')
var debug = (config.debugMode === 'true')


// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require('bluebird')

chai.use(chaiHttp)

// Always use test DB for testing...
var db = config.test_db
var badUUID = uuid.v4()
var badUUID2 = uuid.v4()
var goodUUID = uuid.v4()

// test data
var badSystemIdOnly = {
  'system_id': badUUID
}
var badHostnameOnly = {
  'hostname': 'testSystemSchemaHost'
}
var goodSystem = {
  'system_id': goodUUID,
  'hostname': 'testSystemSchemaHost'
}
var updatedSystem = {
  'system_id': goodUUID,
  'hostname': 'tsetamehcSmetsySahcom'
}

var systemToDelete = {
  'system_id': goodUUID
}

// Add tests
describe('[test_system_schema] Fail on incorrectly formatted System?', function () {
  it('it should not add a system without hostname field', function (done) {
    systemAPI.addSystem(badSystemIdOnly, function (err, result) {
      if (debug) console.log('[test_system_schema] Fails on incorrectly formatted system JSON. Result: ', result)
      if (debug) console.log('testing system add: FAIL')
      chai.expect(result).to.have.property('err')
        .and.equal(400)
      done()
    })
  })
})

describe('[test_system_schema] Fail on incorrectly formatted System?', function () {
  it(' should not add a system without system field', function (done) {
    systemAPI.addSystem(badHostnameOnly, function (err, result) {
      if (debug) console.log('[test_system_schema] Fails on incorrectly formatted system JSON. Result: ', result)
      if (debug) console.log('testing system add: FAIL')
      chai.expect(result).to.have.property('err')
        .and.equal(400)
      done()
    })
  })
})

describe('[test_system_schema] Pass on correctly formatted System?', function () {
  it('should add a correctly formatted system', function (done) {
    systemAPI.addSystem(goodSystem, function (err, result) {
      if (debug) console.log('[test_system_schema] Succeeds on correctly formatted system JSON. Result: ', result)
      if (debug) console.log('testing system add: SUCCESS')
      chai.expect(result).not.to.have.property('err')
      done()
    })
  })
})

describe('[test_system_schema] Return what we just created', function () {
  it('should GET correctly', function (done) {
    systemAPI.getSystem(goodUUID, function (err, result) {
      if (debug) console.log('[test_system_schema] Succeeds on correctly retrieving system JSON. Result: ', result)
      if (debug) console.log('testing system add: SUCCESS')
      chai.expect(result).to.have.property('system_id')
      chai.expect(result.system_id).to.eql(goodUUID)
      chai.expect(result.hostname).to.eql('testSystemSchemaHost')
      done()
    })
  })
})


// Update test
describe('[test_system_schema] Pass on correctly formatted update?', function () {
  it('should update correctly', function (done) {
    systemAPI.updateSystem(goodUUID, updatedSystem, function (err, result) {
    chai.expect(result).to.have.property('system_id')
    chai.expect(result.system_id).to.eql(goodUUID)
    chai.expect(result.hostname).to.eql('tsetamehcSmetsySahcom')
    done()
    })
  })
})


describe('[test_system_schema] Return the entire systems collection', function () {
  it('should return the full collection', function (done) {
    systemAPI.getSystems( function (err, results) {
    if (debug) console.log('[test_system_schema] Return the entire systems collection result:\n', results)
    done()
    })
  })
})


describe('[test_system_schema] Delete what we created', function () {
  it('should delete what we created', function (done) {
    systemAPI.deleteSystem(goodUUID, function (err, result) {
    chai.expect(result).to.eql(true)
    done()
    })
  })
})


// empty DB after tests
after(function (done) {
  if (debug) console.log('[test_system_schema] Dropping test system collection')
  // if (debug) console.log(mongoose.connection.readyState)
  mongoose.connection.db.dropCollection('systems')
  mongoose.connection.close()
  done()
})
