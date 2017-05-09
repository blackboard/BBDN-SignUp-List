/* global describe, it, after */
'use strict'
var Log = require('../controllers/models/logs')
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../server')
var should = chai.should()
var config = require('../config/config')
var mongoose = require('mongoose')
const uuidV1 = require('uuid/v1')
// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require('bluebird')

chai.use(chaiHttp)

// Always use test DB for testing...
var db = config.test_db
/*
{   uuid: { type: String, required: true, unique: true },
    course_uuid: { type: String, required: true },
    logged_on: Date,
    action_by: { type: String, required: true },
    action_on: String,
    action: {
        type: String,
        enum: ['log_add', 'log_remove', 'waitlog_add', 'waitlog_remove', 'log_created', 'log_removed'],
    },
    comment: String
}
*/

//test data
var postedUUID
var goodLog = {
  uuid: uuidV1(), 
  course_uuid: "test_course", 
  action_by: "instructor a.", 
  action_on: "student b.",
  action: "log_add",
  comments: "test post log with full data" 
};

var bad_test_no_uuid = {
  course_uuid: "test_course", 
  action_by: "mark", 
  comments: "test" 
};

var bad_test_no_course_uuid = { 
  uuid: uuidV1(),
  action_by: "mark", 
  comments: "test" 
};

var minimum_good_log = { 
  uuid: uuidV1(), 
  course_uuid: "test_course 12", 
  action_by: "mark" 
};

var log_created_uuid = "";
var comments = "updated comments";

var update_log_comments = { comments: "test post log with full data" };

//POST tests
describe("[test_log_schema] Fail on incorrectly formatted POST?", function() {
    it('it should not POST a log without uuid field', (done) => {
      chai
        .request(server)
        .post('/logs')
        .send(bad_test_no_uuid)
        .end(function(err, res) {
          expect(res).to.have.err;
        });
      done();
    });

    it('it should not POST a log with no bad_test_no_course_uuid', (done) => {
      chai
        .request(server)
        .post('/logs')
        .send(bad_test_no_course_uuid)
        .end(function(err, res) {
          expect(res).to.have.err;
        });
      done();
    });
});


describe("[test_log_schema] Pass on correctly formatted POSTs?", function() {
    it('should POST minimum data correctly', (done) => {
    chai
      .request(server)
      .post('/logs')
      .send(minimum_good_log)
      .end((err, res) => {
        res.should.have.status(201);
      log_created_uuid = res.body.uuid;
      console.log("[test_log_schema]: " + log_created_uuid);
      done();
    });
  });
/*
  it('should POST full data correctly', (done) => {
    chai
      .request(server)
      .post('/logs')
      .send(good_log)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.course_uuid.should.eql("test course");
      log_created_uuid = res.body.uuid;
      done();
    });
  });
*/
});

//GET collection test
describe("[test_log_schema] Return the entire logs collection", function() {
    it('should return the full collection', (done) => {
    chai
      .request(server)
      .get('/logs')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      done();
    });
  });
});



//GET single item test
describe("[test_log_schema] Return what we just created", function() {
    it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/logs/' + log_created_uuid)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      done();
    });

  });
});

//GET single item test
describe("[test_log_schema] Return what we just created", function() {
    it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/logs/' + log_created_uuid)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      done();
    });

  });
});

//Eventually add tests for GETs with date parameters - tested using Paw and hard-coded values.
/*
//GET course logs item test
var courseId = "test_course";
var logDate = "2017-02-14T01:21:05.080Z";

//{"course_uuid": "test_course", "logged_on": {$gte : ISODate("2017-02-14T01:21:14.253Z")}})
describe("[test_log_schema] Return all logs for a course", function() {
    it('should GET all logs (5)', (done) => {
    chai
      .request(server)
      .get('/logs/course/' + courseId)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      console.log(res.body);
      done();
    });
  });
  it('should GET all logs before date 2017-02-14T01:21:14.253Z (3)', (done) => {
    chai
      .request(server)
      .get('/logs/course/' + courseId + '?before=2017-02-14T01:21:14.253Z')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      console.log(res.body);
      done();
    });
  });
    it('should GET all logs after date 2017-02-14T01:21:14.253Z (3)', (done) => {
    chai
      .request(server)
      .get('/logs/course/' + courseId + '?after=2017-02-14T01:21:14.253Z')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      console.log(res.body);
      done();
    });
  });
});
*/

describe("[test_log_schema] Delete what we created", function () {
    it ('should delete what we POSTed', (done) => {
    chai
      .request(server)
      .delete('/logs/' + log_created_uuid)
      .end((err, res) => {
        res.should.have.status(204);
      done();
    });
  });
});

//empty DB after tests
after(function (done) {
  console.log('[test_log_schema] Dropping test log collection');
//    console.log(mongoose.connection.readyState);
  mongoose.connection.on('open', function(){
    mongoose.connection.db.dropCollection('logs');
    mongoose.connection.close();
  });
  done();
});

