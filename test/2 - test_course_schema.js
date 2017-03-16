"use strict";
var Course = require('../controllers/models/courses');
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

var debug = (config.debug_mode=="true"?true:false);

//test data
/*    
{
  uuid: { type: String, required: true, unique: true },
  externalId: { type: String },
  roster: [{
    user_uuid: { type: String, required: true, unique: true }
  }],
  lists: [{ type: Schema.Types.ObjectId, ref: 'List' }],
  ultrafied: { type: Boolean, required: true },
  created_on: Date,
  updated_on: Date 
}
*/
var course_uuid1 = uuidV1();
var course_uuid2 = uuidV1();

var bad_uuid_test = { "ultrafied": false };
var minimum_good_course = { "uuid": course_uuid1, "ultrafied": false };
var good_course = { 
  "uuid": course_uuid1,
  "externalId": "mochaCourseSchemaTestCourse", 
  "ultrafied": false };
var complete_course = { 
  "uuid": course_uuid1,
  "externalId": "mochaCourseSchemaTestCourse", 
  "roster": [],
  "lists": [],
  "ultrafied": false };
var complete_course2 = { 
  "uuid": course_uuid1,
  "externalId": "esruoCtseTamehcSesruoCahcam", 
  "roster": [],
  "lists": [],
  "ultrafied": false };

var course_created = "mochaCourseSchemaTestCourse";
var update_course_externalID = { externalId: "esruoCtseTamehcSesruoCahcam"};
var updated_course_uuid = "esruoCtseTamehcSesruoCahcam"
var course_to_delete = "esruoCtseTamehcSesruoCahcam"


// √ FAIL: POST /courses to create a new SUL course record
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

// √ POST /courses to create a new SUL course record
describe("[test_course_schema] Pass on correctly formatted POST?", function() {
    it('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/courses')
      .send(minimum_good_course)
      .end((err, res) => {
        res.should.have.status(201);
        if (debug) console.log("\n[test_course_schema] POST SUL Course response: \n", res.body );
      done();
      });
  });
});

// √ GET /courses/:id to retrieve a single SUL course
describe("[test_course_schema] Return what we just created", function() {
    it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/courses/' + course_uuid1)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('uuid');
        res.body.uuid.should.eql(course_uuid1);
        if (debug) console.log("\n[test_course_schema] Get SUL Course " + course_uuid1 + " response:\n", res.body );
      done();
      });
  });
});

// PUT /courses/:id = complete update on a specifc course - must provide complete roster or lists element
describe("[test_course_schema] Update a specific course", function() {
  it('should update course with passed data', (done) => {
    chai
      .request(server)
      .put('/courses/' + course_uuid1)
      .send(complete_course)
      .end((err, res) => {
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('uuid');
        res.body.uuid.should.eql(course_uuid1);
        res.should.have.status(200);
        if (debug) console.log("\n[test_course_schema] PUT SUL Course " + course_uuid1 + " response:\n", res.body );
      done();
      });
    });
});

// PATCH /courses/:id - partial update on course record
describe("[test_course_schema] Partial update on specific course", function() {
  var update_data = { "ultrafied": true, "externalId": "UPDATED COURSE EXTERNALID" };
  it('should update course with passed data (ultra and externalId)', (done) => {
    chai 
      .request(server)
      .patch('/courses/' + course_uuid1)
      .send(update_data)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.ultrafied.should.eql(true);
        res.body.externalId.should.eql("UPDATED COURSE EXTERNALID");
        if (debug) console.log("\n[test_course_schema] PATCH SUL Course: " + course_uuid1 + " response\n", res.body );
      done();
      });
    });
  });

// GET /courses/:id/roster - gets the roster from a SUL course
describe("[test_course_schema] Return the full roster for course", function() {
  it('should return the course roster containing moneil and shurrey', (done) => {
    chai
      .request(server)
      .get('/courses/' + course_uuid1 + "/roster")
      .end((err, res) => {
        res.should.have.status(200);
        if (debug) console.log("\n[test_course_schema] GET Course roster response\n", res.body );
      done();
    });
  });
});


// √ GET /courses to retrieve a collection of all SUL courses
describe("[test_course_schema] Return the entire courses collection", function() {
    it('should return the full collection', (done) => {
    chai
      .request(server)
      .get('/courses')
      .end((err, res) => {
        res.should.have.status(200);
        //res.should.be.json;
        if (debug) console.log("\n[test_course_schema] GET SUL Courses response\n", res.body );
      done();
    });
  });
});

/*
 * √ PUT /courses/:id/roster/ - add a complete roster to the SUL course 
 *    --- use PUT to add a user to the roster
 *    --- use DELETE to remove a user from the roster
*/
describe("[test_course_schema] Pass on correctly POSTing roster?", function() {
  var roster = [ { "user_uuid":"moneil"}, {"user_uuid":"shurrey"} ];
    it('should POST correctly', (done) => {
    chai
      .request(server)
      .put('/courses/' + course_uuid1 + "/roster")
      .send(roster)
      .end((err, res) => {
        res.should.have.status(200);
        if (debug) console.log("\n[test_course_schema] POST SUL Course Roster response: \n", res.body );
      done();
      });
  });
});

/*
 * √ PATCH /courses/:id/roster/ - add a user to a roster for the SUL course
 */
describe("[test_course_schema] Pass on correctly adding a user to a SUL course roster", function() {
  var usrToAdd = {
    "user_uuid": "HAWKEYE"
  };

  if (debug) console.log('\n[test_course_schema] PATCH (add) the user ("HAWKEYE") to the roster response: \n', usrToAdd );      

  it('should correctly PUT (add) the user ("HAWKEYE") to the roster.', (done) => {
    chai
      .request(server)
      .patch('/courses/' + course_uuid1 + "/roster")
      .send(usrToAdd)
      .end((err, res) => {
        res.should.have.status(200);
        if (debug) console.log('\n[test_course_schema] PATCH (add) the user ("HAWKEYE") to the roster response: \n', res.body );      
      done();
      });
  });
});


/*
 * √ GET /courses/:id/roster/:user_uuid - gets a specific user from the roster
 */
describe("[test_course_schema] GET specific user from course roster", function() {
  var user = "HAWKEYE";
    it('should return the requested user_uuid', (done) => {
    chai
      .request(server)
      .get('/courses/'+ course_uuid1 + '/roster/' + user)
      .end((err, res) => {
        res.should.have.status(200);
        //res.should.be.json;
        res.body.user_uuid.should.eql("HAWKEYE")
        if (debug) console.log("\n[test_course_schema] GET specific user (HAWKEYE) response\n", res.body );
      done();
    });
  });
});

/*
 * √ DELETE /courses/:id/roster/:user_uuid - delete a user from the roster
 */  
describe("[test_course_schema] DELETE User from roster", function() {
  it('should delete the specified user (HAWKEYE) from the roster', (done) => {
    chai
      .request(server)
      .delete('/courses/' + course_uuid1 + "/roster/" + "HAWKEYE")
      .end((err, res) => {
        res.should.not.have.err;
        res.should.have.status(200);
        res.body.roster.length.should.be.eql(2);
      });
      done();
  });
});

/*
 * √ DELETE /courses/:id/roster - delete a whole roster
 */
describe("[test_course_schema] DELETE roster", function() {
  it('should delete the roster for the requested course', (done) => {
    chai
      .request(server)
      .delete('/courses/' + course_uuid1 + "/roster")
      .end((err, res) => {
        res.should.not.have.err;
        res.should.have.status(200);
        res.body.roster.length.should.be.eql(0);
        if (debug) console.log("\n[test_course_schema DELETE roster] Results: :\n", res.body);
      });
      done();
  });
});


/*
 * √ DELETE /courses/:id/lists - delete a whole list of lists
 */
describe("[test_course_schema] DELETE lists", function() {
  it('should empty the list of lists for the requested course', (done) => {
    chai
      .request(server)
      .delete('/courses/' + course_uuid1 + "/lists")
      .end((err, res) => {
        res.should.not.have.err;
        res.should.have.status(200);
        res.body.lists.length.should.be.eql(0);
      });
      done();
  });
});
 


// √ DELETE /courses/:id - delete existing SUL course
describe("[test_course_schema] Delete what we created", function() {
    it('should delete what we POSTed', (done) => {
    chai
      .request(server)
      .delete('/courses/' + course_uuid1)
      .end((err, res) => {
        res.should.have.status(204);
      done();
    });
  });
});


//empty DB after tests
after(function (done) {
    console.log('[test_course_schema] Dropping test course collection');
    mongoose.connection.db.dropCollection('courses');
    mongoose.connection.close();
    done();
});

