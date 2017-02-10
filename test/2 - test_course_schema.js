"use strict";
var Course = require('../controllers/models/courses');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var config = require('../config/config');
var mongoose = require("mongoose");
// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require("bluebird");

chai.use(chaiHttp);

//Always use test DB for testing...
var db = config.test_db;

//test data
var good_course = { uuid: "mochaCourseSchemaTestCourse", ultrafied: false }
var bad_uuid_test = { ultrafied: false }
var minimum_good_course = { uuid: "mochaCourseSchemaTestCourse", ultrafied: false }
var complete_course = { uuid: "mochaCourseSchemaTestCourse", ultrafied: false }

//POST tests

describe("[test_course_schema] Fail on incorrectly formatted POST?", function() {
    it('it should not POST a course without uuid field', (done) => {
    chai
      .request(server)
      .post('/courses')
      .send(bad_uuid_test)
      .end(function(err, res) {
        expect(res).to.have.err;
      });
      done();
    });
  });

describe("[test_system_schema] Pass on correctly formatted POST?", function() {
     it('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/courses')
      .send(minimum_good_course)
      .end((err, res) => {
        res.should.have.status(201);
        JSON.stringify(res.body).should.be.eql('{"system_id":"mochaSystemSchemaTest","hostname":"testSystemSchemaHost"}');
      done();
    });
  });
});
*/


describe("[test_course_schema] Pass on correctly formatted POST?", function() {
     it('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/courses')
      .send(good_course)
      .end((err, res) => {
        res.should.have.status(200);
      done();
    });
  });
});


//PUT test
describe("[test_course_schema] Pass on correctly formatted PUT?", function() {
    it('should PUT correctly', (done) => {
    chai
      .request(server)
      .put('/courses/mochaCourseSchemaTest')
      .send(updated_course)
      .end((err, res) => {
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('course_id');
        res.body.course_id.should.eql('tsetamehcSmetsySahcom');
      done();
    });
  });
});

describe("[test_course_schema] Return what we just created", function() {
    it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/courses/tsetamehcSmetsySahcom')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('course_id');
        res.body.course_id.should.eql('tsetamehcSmetsySahcom');
      done();
    });
  });
});

describe("[test_course_schema] Return the entire courses collection", function() {
    it('should return the full collection', (done) => {
    chai
      .request(server)
      .get('/courses')
      .send(updated_course)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      done();
    });
  });
});
*/

//empty DB after tests
after(function (done) {
    console.log('[test_course_schema] Dropping test course collection');
    mongoose.connection.db.dropCollection('courses');
    mongoose.connection.close();
    done();
});