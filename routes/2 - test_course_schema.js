"use strict";
var Course = require('../controllers/models/courses');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var config = require('../config/config');
var mongoose = require("mongoose");
// Use bluebird since mongoose has deprecated mPromise
//mongoose.Promise = require("bluebird");

chai.use(chaiHttp);

//Always use test DB for testing...
var db = config.test_db;

//test data
var good_course = { uuid: "mochaCourseSchemaTestCourse", ultrafied: false };
var bad_uuid_test = { ultrafied: false };
var minimum_good_course = { uuid: "mochaCourseSchemaTestCourse", ultrafied: false };
var complete_course = { uuid: "mochaCourseSchemaTestCourse", ultrafied: false };
var course_created = "mochaCourseSchemaTestCourse";
var update_course_uuid = { uuid: "esruoCtseTamehcSesruoCahcam"};
var updated_course_uuid = "esruoCtseTamehcSesruoCahcam"
var course_to_delete = "esruoCtseTamehcSesruoCahcam"

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

describe("[test_course_schema] Pass on correctly formatted POST?", function() {
    it('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/courses')
      .send(minimum_good_course)
      .end((err, res) => {
        res.should.have.status(201);
      done();
    });
  });
});

//GET single item test
describe("[test_course_schema] Return what we just created", function() {
    it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/courses/' + course_created)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('uuid');
        res.body.uuid.should.eql('mochaCourseSchemaTestCourse');
      done();
    });
  });
});

//GET collection test
describe("[test_course_schema] Return the entire courses collection", function() {
    it('should return the full collection', (done) => {
    chai
      .request(server)
      .get('/courses')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      done();
    });
  });
});

//PUT (update) test
describe("[test_course_schema] Pass on correctly formatted PUT?", function() {
    it('should PUT (update) item correctly', (done) => {
    chai
      .request(server)
      .put('/courses/' + course_created)
      .send(update_course_uuid)
      .end((err, res) => {
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('uuid');
        res.body.uuid.should.eql(updated_course_uuid);
      done();
    });
  });
});


describe("[test_course_schema] Delete what we created", function() {
    it('should delete what we POSTed', (done) => {
    chai
      .request(server)
      .delete('/courses/' + course_to_delete)
      .end((err, res) => {
        res.should.have.status(204);
      done();
    });
  });
});


//empty DB after tests
after(function (done) {
    console.log('[test_course_schema] Dropping test course collection');
    console.log(mongoose.connection.readyState);
    mongoose.connection.db.dropCollection('courses');
    mongoose.connection.close();
    done();
});
