'use strict'
var Course = require('../controllers/models/courses')
var jwtUtils = require('../controllers/routes/jwtToken.js')
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../server')
var should = chai.should()
var config = require('../config/config')
var mongoose = require('mongoose')
const uuid = require('uuid')
// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require('bluebird')

chai.use(chaiHttp)

// Always use test DB for testing...
var db = config.test_db

var debug = (config.debugMode === 'true')

// JWT test data
var jtiInstructor = uuid.v4()
var xsrfTokenInstructor = uuid.v4()
var userUUIDInstructor = 'moneilInstructor'
var userRoleInstructor = ['instructor']
var jwtTokenInstructor
var jtiStudent = uuid.v4()
var xsrfTokenStudent = uuid.v4()
var userUUIDStudent = 'moneilStudent'
var userRoleStudent = ['learner']
var jwtTokenStudent
/*
 * jwtClaims:
 *  iss: issuer - in this case the SignUp List
 *  system: system bound to the request eg:www.mount.edu (LTI launch)
 *  exp: token expiry - in this case one hour
 *    TBD: expired tokens may be regenerated based on original claims
 *  iat: when the token was issued
 *  xsrfToken: used for preventing xsrf compared to stored token
 *  jti: unique token identifier - used for jwtTokenCache key
 *  sub: subject of the token - the Learn User UUID (LTI launch)
 *  userRole: the user's role (LTI launch)
 *    valid userRoles: 'instructor', 'teachingassistant', 'grader', 'learner', 'administrator'
 */
var jwtClaimsInstructor = {
  'iss': 'SignUp List',
  'system': 'localhost',
  'exp': Math.floor(Date.now() / 1000) + (60 * 60),
  'iat': Date.now(),
  'xsrfToken': xsrfTokenInstructor,
  'jti': jtiInstructor,
  'sub': userUUIDInstructor,
  'userRole': userRoleInstructor
}

var jwtClaimsStudent = {
  'iss': 'SignUp List',
  'system': 'localhost',
  'exp': Math.floor(Date.now() / 1000) + (60 * 60),
  'iat': Date.now(),
  'xsrfToken': xsrfTokenStudent,
  'jti': jtiStudent,
  'sub': userUUIDStudent,
  'userRole': userRoleStudent
}

jwtTokenInstructor = jwtUtils.genJWTToken(jwtClaimsInstructor)
jwtTokenStudent = jwtUtils.genJWTToken(jwtClaimsStudent)

jwtUtils.cacheJwtToken(jwtClaimsInstructor.jti, jwtTokenInstructor, jwtClaimsInstructor.exp)
jwtUtils.cacheJwtToken(jwtClaimsStudent.jti, jwtTokenStudent, jwtClaimsStudent.exp)

/* 
 * test data
{
  uuid: { type: String,required: true, unique: true },
  externalId: { type: String },
  roster: [{
    user_uuid: { type: String, required: true,unique: true }
  }],
  lists: [{ type: Schema.Types.ObjectId, ref: 'List' }],
  ultrafied: { type: Boolean,required: true },
  created_on: Date,
  updated_on: Date
}
*/

var courseUUID1 = uuid.v4()
var courseUUID2 = uuid.v4()

var badUUIDTest = { 'ultrafied': false }
var minimumGoodCourse = { 'uuid': courseUUID1, 'ultrafied': false }
var goodCourse = {
  'uuid': courseUUID1,
  'externalId': 'mochaCourseSchemaTestCourse',
  'ultrafied': false }
var completeCourse = {
  'uuid': courseUUID1,
  'externalId': 'mochaCourseSchemaTestCourse',
  'roster': [],
  'lists': [],
  'ultrafied': false }
var completeCourse2 = {
  'uuid': courseUUID1,
  'externalId': 'esruoCtseTamehcSesruoCahcam',
  'roster': [],
  'lists': [],
  'ultrafied': false }

var courseCreated = 'mochaCourseSchemaTestCourse'
var updateCourseExternalID = {externalId: 'esruoCtseTamehcSesruoCahcam'}
var updatedCourseUUID = 'esruoCtseTamehcSesruoCahcam'
var courseToDelete = 'esruoCtseTamehcSesruoCahcam'



// √ FAIL: POST /courses to create a new SUL course record
describe('[test_course_schema] Fail on incorrectly formatted POST with AP privileges?', function () {
  it('it should FAIL - not POST a course without uuid field', (done) => {
    chai
      .request(server)
      .post('/courses').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(badUUIDTest)
      .end(function (err, res) {
        expect(res).to.have.err
      })
    done()
  })
})

// √ POST /courses to create a new SUL course record
describe('[test_course_schema] Pass on correctly formatted POST with AP privileges?', function () {
  console.log('[test_course_schema] minimum good course: ', minimumGoodCourse)
  it ('should PASS - POST correctly for AP Role', (done) => {
    chai
      .request(server)
      .post('/courses').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(minimumGoodCourse)
      .end((err, res) => {
        res.should.have.status(201)
        if (debug) console.log('\n[test_course_schema] POST SUL Course response: \n', res.body)
        done()
      })
  })
})

// √ POST /courses to create a new SUL course record
describe('[test_course_schema] Fail on POST attempt with non-AP privileges?', function () {
  console.log('[test_course_schema] Fail: ', minimumGoodCourse)
  it ('should FAIL to POST for SP Role', (done) => {
    chai
      .request(server)
      .post('/courses').set('Cookie', 'sulToken=' + jwtTokenStudent)
      .send(minimumGoodCourse)
      .end((err, res) => {
        res.should.have.status(403)
        if (debug) console.log('\n[test_course_schema] POST SUL Course with SP (fail) response: \n', res.body)
        done()
      })
  })
})

// √ GET /courses/:id to retrieve a single SUL course
describe('[test_course_schema] Return what we just created with SP privileges', function () {
  it('should GET correctly for SP Role', (done) => {
    chai
      .request(server)
      .get('/courses/' + courseUUID1).set('Cookie', 'sulToken=' + jwtTokenStudent)
      .end((err, res) => {
        res.should.have.status(200)
        // res.should.be.json
        res.body.should.be.a('object')
        res.body.should.have.property('uuid')
        res.body.uuid.should.eql(courseUUID1)
        if (debug) console.log('\n[test_course_schema] Get SUL Course ' + courseUUID1 + ' response:\n', res.body)
        done()
      })
  })
})

// PUT /courses/:id = complete update on a specifc course - must provide complete roster or lists element
describe('[test_course_schema] Update a specific course', function () {
  it('should FAIL to update course with passed data and SP privileges', (done) => {
    chai
      .request(server)
      .put('/courses/' + courseUUID1).set('Cookie', 'sulToken=' + jwtTokenStudent)
      .send(completeCourse)
      .end((err, res) => {
        res.should.have.status(403)
        if (debug) console.log('\n[test_course_schema] PUT SUL Course ' + courseUUID1 + ' response:\n', res.body)
        done()
      })
  })

  it('should PASS update course with passed data and AP privileges', (done) => {
    chai
      .request(server)
      .put('/courses/' + courseUUID1).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(completeCourse)
      .end((err, res) => {
        res.should.be.json
        res.body.should.be.a('object')
        res.body.should.have.property('uuid')
        res.body.uuid.should.eql(courseUUID1)
        res.should.have.status(200)
        if (debug) console.log('\n[test_course_schema] PUT SUL Course ' + courseUUID1 + ' response:\n', res.body)
        done()
      })
  })
})

// PATCH /courses/:id - partial update on course record
describe('[test_course_schema] Partial update on specific course', function () {
  var updateData = { 'ultrafied': true, 'externalId': 'UPDATED COURSE EXTERNALID' }
  it('should FAIL to update course with passed data (ultra and externalId) and SP Role', (done) => {
    chai 
      .request(server)
      .patch('/courses/' + courseUUID1).set('Cookie', 'sulToken=' + jwtTokenStudent)
      .send(updateData)
      .end((err, res) => {
        res.should.have.status(403)
        if (debug) console.log('\n[test_course_schema] PATCH SUL Course: ' + courseUUID1 + ' response\n', res.body)
        done()
      })
  })

   it('should PASS to update course with passed data (ultra and externalId) and AP Role', (done) => {
    chai 
      .request(server)
      .patch('/courses/' + courseUUID1).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(updateData)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.ultrafied.should.eql(true)
        res.body.externalId.should.eql('UPDATED COURSE EXTERNALID')
        if (debug) console.log('\n[test_course_schema] PATCH SUL Course: ' + courseUUID1 + ' response\n', res.body)
        done()
      })
  })

})

// √ GET /courses to retrieve a collection of all SUL courses
describe('[test_course_schema] Return the entire courses collection', function () {
  it('should FAIL return the full collection for a SP Role', (done) => {
    chai
      .request(server)
      .get('/courses').set('Cookie', 'sulToken=' + jwtTokenStudent)
      .end((err, res) => {
        res.should.have.status(403)
        // res.should.be.json
        if (debug) console.log('\n[test_course_schema] GET SUL Courses response\n', res.body)
        done()
      })
  })

  it('should PASS return the full collection for a AP Role', (done) => {
    chai
      .request(server)
      .get('/courses').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        res.should.have.status(200)
        // res.should.be.json
        if (debug) console.log('\n[test_course_schema] GET SUL Courses response\n', res.body)
        done()
      })
  })
})

/*
 * √ DELETE /courses/:id/lists - delete a whole list of lists
 */
describe('[test_course_schema] DELETE lists (AP Role Only)', function () {
  it('FAIL - SP Role should fail to empty the list of lists for the requested course', (done) => {
    chai
      .request(server)
      .delete('/courses/' + courseUUID1 + '/lists').set('Cookie', 'sulToken=' + jwtTokenStudent)
      .end((err, res) => {
        res.should.have.status(403)
      })
    done()
  })

  it('PASS - AP Role should empty the list of lists for the requested course', (done) => {
    chai
      .request(server)
      .delete('/courses/' + courseUUID1 + '/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        res.should.not.have.err
        res.should.have.status(200)
        res.body.lists.length.should.be.eql(0)
      })
    done()
  })
})

// √ DELETE /courses/:id - delete existing SUL course
describe('[test_course_schema] Delete what we created', function () {
    it('should delete what we POSTed',(done) => {
    chai
      .request(server)
      .delete('/courses/' + courseUUID1).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err,res) => {
        res.should.have.status(204)
      done()
    })
  })
})


// √ Empty DB after tests
after(function (done) {
    console.log('[test_course_schema] Dropping test course collection')
    mongoose.connection.db.dropCollection('courses')
    mongoose.connection.close()
    done()
})
