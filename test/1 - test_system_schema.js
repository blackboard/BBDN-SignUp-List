'use strict'
var System = require('../controllers/models/systems')
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../server')
var should = chai.should()
var config = require('../config/config')
var mongoose = require('mongoose')
// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require("bluebird");

chai.use(chaiHttp)

// Always use test DB for testing...
var db = config.test_db

// test data
var badSystemIdOnly = {
  system_id: 'mochaSystemSchemaTest'
}
var badHostnameOnly = {
  hostname: 'testSystemSchemaHost'
}
var goodSystem = {
  system_id: 'mochaSystemSchemaTest',
  hostname: 'testSystemSchemaHost'
}
var updatedSystem = {
  system_id: 'tsetamehcSmetsySahcom'
}

var systemToDelete = {
  system_id: "tsetamehcSmetsySahcom"
}

// POST tests
describe("[test_system_schema] Fail on incorrectly formatted POST?", function () {
    it('it should not POST a system without hostname field', (done) => {
    chai
      .request(server)
      .post('/systems')
      .send(badSystemIdOnly)
      .end(function (err, res) {
        expect(res).to.have.err
      })
      done()
    })
})

describe("[test_system_schema] Fail on incorrectly formatted POST?", function () {
    it(' should not POST a system without system field', (done) => {
    chai
      .request(server)
      .post('/systems')
      .send(badHostnameOnly)
      .end(function (err, res) {
        expect(res).to.have.err
      })
      done()
    })
})

describe("[test_system_schema] Pass on correctly formatted POST?", function () {
  it('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/systems')
      .send(goodSystem)
      .end((err, res) => {
        res.should.have.status(201)
        JSON.stringify(res.body).should.be.eql('{"system_id":"mochaSystemSchemaTest","hostname":"testSystemSchemaHost"}')
        done()
      })
  })
})

//PUT test
describe("[test_system_schema] Pass on correctly formatted PUT?", function () {
  it('should PUT correctly', (done) => {
    chai
      .request(server)
      .put('/systems/mochaSystemSchemaTest')
      .send(updatedSystem)
      .end((err, res) => {
        res.should.be.json
        res.body.should.be.a('object')
        res.body.should.have.property('system_id')
        res.body.system_id.should.eql('tsetamehcSmetsySahcom')
        done()
      })
  })
})

describe("[test_system_schema] Return what we just created", function () {
  it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/systems/tsetamehcSmetsySahcom')
      .end((err, res) => {
        res.should.have.status(200)
        res.should.be.json
        res.body.should.be.a('object')
        res.body.should.have.property('system_id')
        res.body.system_id.should.eql('tsetamehcSmetsySahcom')
        done()
      })
  })
})

describe("[test_system_schema] Return the entire systems collection", function () {
  it('should return the full collection', (done) => {
    chai
      .request(server)
      .get('/systems')
      .end((err, res) => {
        res.should.have.status(200)
        res.should.be.json
        done()
      })
  })
})

describe("[test_system_schema] Delete what we created", function () {
  it('should delete what we POSTed', (done) => {
    chai
      .request(server)
      .delete('/systems/' + systemToDelete)
      .end((err, res) => {
        res.should.have.status(204)
        done()
      })
  })
})

// empty DB after tests
after(function (done) {
    console.log('[test_system_schema] Dropping test system collection')
// console.log(mongoose.connection.readyState)
    mongoose.connection.db.dropCollection('systems')
    mongoose.connection.close()
    done()
})
