'use strict'
var Course = require('../controllers/models/courses')
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

var debug = (config.debugMode === 'true')

// test data
/*    
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

var courseUUID1 = uuidV1()
var courseUUID2 = uuidV1()

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
describe('[test_course_schema] Fail on incorrectly formatted POST?', function () {
  it('it should not POST a course without uuid field', (done) => {
    chai
      .request(server)
      .post('/courses')
      .send(badUUIDTest)
      .end(function (err, res) {
        expect(res).to.have.err
      })
    done()
  })
})

// √ POST /courses to create a new SUL course record
describe('[test_course_schema] Pass on correctly formatted POST?',function () {
  console.log('[test_course_schema] minimum good course: ', minimumGoodCourse)
  it ('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/courses')
      .send(minimumGoodCourse)
      .end((err, res) => {
        res.should.have.status(201)
        if (debug) console.log('\n[test_course_schema] POST SUL Course response: \n', res.body)
        done()
      })
  })
})

// √ GET /courses/:id to retrieve a single SUL course
describe('[test_course_schema] Return what we just created', function () {
  it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/courses/' + courseUUID1)
      .end((err, res) => {
        res.should.have.status('200')
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
  it('should update course with passed data', (done) => {
    chai
      .request(server)
      .put('/courses/' + courseUUID1)
      .send(completeCourse)
      .end((err, res) => {
        res.should.be.json
        res.body.should.be.a('object')
        res.body.should.have.property('uuid')
        res.body.uuid.should.eql(courseUUID1)
        res.should.have.status('200')
        if (debug) console.log('\n[test_course_schema] PUT SUL Course ' + courseUUID1 + ' response:\n', res.body)
        done()
      })
  })
})

// PATCH /courses/:id - partial update on course record
describe('[test_course_schema] Partial update on specific course', function () {
  var updateData = { 'ultrafied': true, 'externalId': 'UPDATED COURSE EXTERNALID' }
  it('should update course with passed data (ultra and externalId)', (done) => {
    chai 
      .request(server)
      .patch('/courses/' + courseUUID1)
      .send(updateData)
      .end((err, res) => {
        res.should.have.status('200')
        res.body.ultrafied.should.eql(true)
        res.body.externalId.should.eql('UPDATED COURSE EXTERNALID')
        if (debug) console.log('\n[test_course_schema] PATCH SUL Course: ' + courseUUID1 + ' response\n', res.body)
        done()
      })
  })
})

// √ GET /courses to retrieve a collection of all SUL courses
describe('[test_course_schema] Return the entire courses collection', function () {
  it('should return the full collection', (done) => {
    chai
      .request(server)
      .get('/courses')
      .end((err, res) => {
        res.should.have.status('200')
        // res.should.be.json
        if (debug) console.log('\n[test_course_schema] GET SUL Courses response\n', res.body)
        done()
      })
  })
})

/*
 * √ DELETE /courses/:id/lists - delete a whole list of lists
 */
describe('[test_course_schema] DELETE lists', function () {
  it('should empty the list of lists for the requested course', (done) => {
    chai
      .request(server)
      .delete('/courses/' + courseUUID1 + '/lists')
      .end((err, res) => {
        res.should.not.have.err
        res.should.have.status('200')
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
      .delete('/courses/' + courseUUID1)
      .end((err,res) => {
        res.should.have.status('204')
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
