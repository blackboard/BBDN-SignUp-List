"use strict";
var List = require('../controllers/models/lists');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var config = require('../config/config');
var mongoose = require("mongoose");
const uuidV1 = require('uuid/v1');
// Use bluebird since mongoose has deprecated mPromise
//mongoose.Promise = require("bluebird");

chai.use(chaiHttp);

//Always use test DB for testing...
var db = config.test_db;
/* LISTS 
    {
        name: { type: String, required: true },
        description: String,
        location: String,
        start: { type: Date, required: true },
        end: Date,
        waitlist_allowed: { type: Boolean, default: false }
        max_size: Number,
        max_waitlist: Number,
        state: {
            type: String,
            enum: ['NEW', 'STATUS'],
            default: 'NEW'
        },
        group: String,
        userlist: [{
            user_uuid: String,
            role: { type: String,
                enum: ['INSTRUCTOR', 'TEACHING_ASSISTANT', 'STUDENT'],
                default: 'STUDENT'},
            added_by: String,
            waitlisted: { type: Boolean, default: false },
            created_on: Date,
            updated_on: Date },
            { timestamps: {
                createdAt: 'created_on',
                updatedAt: 'updated_on'}
        }]
*/

//test data
var good_list = { uuid: "mochaListSchemaTestList", ultrafied: false };
var bad_test_no_uuid = {
        "name": "no start date",
        "description": "test post list with no start date",
        "start": new Date(),
        "max_size": 30,
        "max_waitlist": 3,
};

var bad_test_no_name = { 
        "uuid": uuidV1(),
        "description": "test post list with no name",
        "start": new Date(),
        "max_size": 30,
        "max_waitlist": 3, 
};

var bad_test_no_date = { 
        "uuid": uuidV1(),
        "name": "no start date",
        "description": "test post list with no start date",
        "max_size": 30,
        "max_waitlist": 3,
};

var minimum_good_list = { 
        "uuid": uuidV1(),
        "name": "This is the minimum Good List",
        "description": "test post list with minimum data",
        "start": new Date(),
        "max_size": 30,
        "max_waitlist": 3
};
var list_created_uuid = "";
var update_list_name = { name: "tsiLtseTamehcStsiLahcom"};
var updated_list_name = "tsiLtseTamehcStsiLahcom"

//POST tests
describe("[test_list_schema] Fail on incorrectly formatted POST?", function() {
    it('it should not POST a list without uuid field', (done) => {
      chai
        .request(server)
        .post('/lists')
        .send(bad_test_no_uuid)
        .end(function(err, res) {
          expect(res).to.have.err;
        });
      done();
    });

    it('it should not POST a list without Name field', (done) => {
      chai
        .request(server)
        .post('/lists')
        .send(bad_test_no_name)
        .end(function(err, res) {
          expect(res).to.have.err;
        });
      done();
    });
    
    it('it should not POST a list without start date field', (done) => {
      chai
        .request(server)
        .post('/lists')
        .send(bad_test_no_date)
        .end(function(err, res) {
          expect(res).to.have.err;
        });
        done();
    });
  });


describe("[test_list_schema] Pass on correctly formatted POST?", function() {
    it('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/lists')
      .send(minimum_good_list)
      .end((err, res) => {
        res.should.have.status(201);
      list_created_uuid = res.body.uuid;
      console.log(list_created_uuid);
      done();
    });
  });
});


//GET single item test
describe("[test_list_schema] Return what we just created", function() {
    it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/lists/' + list_created_uuid)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      done();
    });

  });
});


//GET collection test
describe("[test_list_schema] Return the entire lists collection", function() {
    it('should return the full collection', (done) => {
    chai
      .request(server)
      .get('/lists')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
      done();
    });
  });
});

//PUT (update) test
describe("[test_list_schema] Pass on correctly formatted PUT?", function() {
    it('should PUT (update) item correctly', (done) => {
    chai
      .request(server)
      .put('/lists/' + list_created_uuid)
      .send(update_list_name)
      .end((err, res) => {
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.eql(updated_list_name);
      done();
    });
  });
});


describe("[test_list_schema] Delete what we created", function() {
    it('should delete what we POSTed', (done) => {
    // get a list of _ids
     
    chai
      .request(server)
      .delete('/lists/' + list_created_uuid)
      .end((err, res) => {
        res.should.have.status(204);
      done();
    });
  });
});

//empty DB after tests
after(function (done) {
    console.log('[test_list_schema] Dropping test list collection');
//    console.log(mongoose.connection.readyState);
    mongoose.connection.db.dropCollection('lists');
    mongoose.connection.close();
    done();
});
