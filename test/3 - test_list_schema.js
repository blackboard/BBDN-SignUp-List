/* global describe, it */
'use strict'
var mongoose = require("mongoose")
var List = require('../controllers/models/lists')
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../server')
var config = require('../config/config')
const uuid = require('uuid')
var should = chai.should()
var expect = chai.expect()
var jwtUtils = require('../controllers/routes/jwtToken.js')

// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require('bluebird')

chai.use(chaiHttp)

// Always use test DB for testing...
var db = config.test_db
var debug = (config.debug_mode === 'true')

if (debug) console.log('\n[test_list_schema.js] DB: ' + db)

/*
LISTS Collection
    list_uuid: TEST, Required, Unique
    list_name: TEXT                                     #e.g. Mid-term Study Groups
    list_description: TEXT                              #e.g. 5 groups available
    list_visible_start: DATETIME                        #Determines visibility of list to students.
    list_visible_end: DATETIME                          #Determines visibility of list to students.
    list_state: TEXT/ENUM ['OPEN', 'CLOSED'], default: ‘OPEN’  #State determined by reg'd users
                                                               # - CLOSED when Group(s) size/waitlist quotas are met.
                                                               # - CLOSED when list_visible_end is met.
    student_view: BOOLEAN, default: false                # Determines group member visibility to students
    group_list: ARRAY of Group:                          #There is always one group. 1…n
        grp_uuid: TEXT, Required, Unique                 #Group unique ID
        grp_name: TEXT                                   #e.g. Mid-term Study Group: MONDAY (optional)
        grp_description: TEXT                            #e.g. Meets Mondays (optional)
        grp_location: TEXT                               #Where it meets (optional)
        grp_start: DATETIME                              #meeting time for group (optional)
        grp_end: DATETIME                                #meeting time for group (optional)
        grp_waitlist_allowed: BOOLEAN default: false
        grp_max_size: INTEGER                            #maximum number of students in the group
        grp_max_waitlist: INTEGER                        #maximum number of students to be waitlisted
        grp_state: TEXT/ENUM ['OPEN', 'CLOSED'], default: ‘OPEN'    #State determined by reg'd users
                                                                    #  - CLOSED when Group size/waitlist quotas are met
        user_list: ARRAY of User:
          user: TEXT (UUID)
          role: TEXT/ENUM: ['INSTRUCTOR', 'TEACHING_ASSISTANT', 'STUDENT'] default: 'STUDENT’
          created_on: DATETIME
          modified: DATETIME
          added_by: TEXT
          waitlisted: BOOLEAN

 */

// test data

const listUUID = uuid.v4()

var badTestNoUUID = {
  'list_name': 'no start date',
  'list_description': 'test post list with no start date',
  'list_visible_start': new Date(),
  'list_visible_end': new Date()
}

var badTestNoName = {
  'list_uuid': listUUID,
  'list_description': 'test post list with no name',
  'list_visible_start': new Date(),
  'list_visible_end': new Date()
}

var badTestNoDates = {
  'list_uuid': listUUID,
  'list_name': 'no start date',
  'list_description': 'test post list with no start date'
}

var badTestNoStartDate = {
  'list_uuid': listUUID,
  'list_name': 'no start date',
  'list_description': 'test post list with no start date',
  'list_visible_end': new Date()
}

var badTestNoEndDate = {
  'list_uuid': listUUID,
  'list_name': 'no start date',
  'list_description': 'test post list with no start date',
  'list_visible_start': new Date()
}

var listVisibleEndDate = new Date()
listVisibleEndDate.setDate(listVisibleEndDate.getDate() + 7)

var minimumGoodList = {
  'list_uuid': listUUID,
  'list_name': 'This is the minimum Good List',
  'list_description': 'test post list with minimum data',
  'list_visible_start': new Date(),
  'list_visible_end': listVisibleEndDate,
  'list_state': 'OPEN',
  'student_view': 'false',
  'list_groups': []
}


var grpEnd = new Date()
grpEnd.setDate(grpEnd.getDate() + 7)
var grpOneUUID = uuid.v4()
var grpTwoUUID = uuid.v4()
var grpThreeUUID = uuid.v4()
var grpFourUUID = uuid.v4()

var updateListNameJSON = { 'name': 'tsiLtseTamehcStsiLahcom' }
var updatedListName = 'tsiLtseTamehcStsiLahcom'

var listUUID2 = uuid.v4()
var listUUID3 = uuid.v4()
var listUUID4 = uuid.v4()
if (debug) console.log('****** [test_list_schema] LISTUUID ******: ', listUUID)
if (debug) console.log('****** [test_list_schema] LISTUUID2 ******: ', listUUID2)

var listGroupsNoUsers = {
  'list_uuid': listUUID2,
  'list_name': 'This is the minimum Good List',
  'list_description': 'test post list with minimum data - Groups/No Users',
  'list_visible_start': new Date(),
  'list_visible_end': listVisibleEndDate,
  'list_state': 'OPEN',
  'student_view': 'false',
  'list_groups': [
    {
      'grp_uuid': grpOneUUID,
      'grp_name': 'Group One',
      'grp_description': 'First Group',
      'grp_location': 'Rm 1313',
      'grp_start': new Date(),
      'grp_end': grpEnd,
      'grp_waitlist_allowed': true,
      'grp_max_size': 4,
      'grp_max_waitlist': 1,
      'grp_state': 'OPEN',
      'grp_members': []
    },
    {
      'grp_uuid': grpTwoUUID,
      'grp_name': 'Group Two',
      'grp_description': 'Second Group',
      'grp_location': 'Rm 1313',
      'grp_start': new Date(),
      'grp_end': grpEnd,
      'grp_waitlist_allowed': true,
      'grp_max_size': 4,
      'grp_max_waitlist': 1,
      'grp_state': 'OPEN',
      'grp_members': []
    }
  ]
}

var listGroupsWithUsers = {
  'list_uuid': listUUID3,
  'list_name': 'This is the minimum Good List',
  'list_description': 'test post list with minimum data',
  'list_visible_start': new Date(),
  'list_visible_end': listVisibleEndDate,
  'list_state': 'OPEN',
  'student_view': 'false',
  'list_groups': [
    {
      'grp_uuid': grpOneUUID,
      'grp_name': 'Group One',
      'grp_description': 'First Group',
      'grp_location': 'Rm 1313',
      'grp_start': new Date(),
      'grp_end': grpEnd,
      'grp_waitlist_allowed': true,
      'grp_max_size': 4,
      'grp_max_waitlist': 1,
      'grp_state': 'OPEN',
      'grp_members': [
        { 'user_uuid': 'SUPERMAN',
          'role': 'STUDENT',
          'added_by': 'BATMAN',
          'waitlisted': false},
        { 'user_uuid': 'AQUAMAN',
          'role': 'STUDENT',
          'added_by': 'WONDER WOMAN',
          'waitlisted': true } ]
    },
    {
      'grp_uuid': grpTwoUUID,
      'grp_name': 'Group Two',
      'grp_description': 'Second Group',
      'grp_location': 'Rm 1313',
      'grp_start': new Date(),
      'grp_end': grpEnd,
      'grp_waitlist_allowed': true,
      'grp_max_size': 4,
      'grp_max_waitlist': 1,
      'grp_state': 'OPEN',
      'grp_members': [
        { 'user_uuid': 'HAWKEYE',
          'role': 'STUDENT',
          'added_by': 'BLACKWIDOW',
          'waitlisted': false},
        { 'user_uuid': 'HULK',
          'role': 'STUDENT',
          'added_by': 'BRUCE BANNER',
          'waitlisted': true },
        { 'user_uuid': 'CAPT AMERICA',
          'role': 'STUDENT',
          'added_by': 'IRON MAN',
          'waitlisted': true
        } ]
    } ]
}

var grpMbrTest = {
  'list_uuid': listUUID4,
  'list_name': 'This is the minimum Good List',
  'list_description': 'test post list with minimum data',
  'list_visible_start': new Date(),
  'list_visible_end': listVisibleEndDate,
  'list_state': 'OPEN',
  'student_view': 'true',
  'list_groups': [
    {
      'grp_uuid': grpOneUUID,
      'grp_name': 'Group One',
      'grp_description': 'First Group',
      'grp_location': 'Rm 1313',
      'grp_start': new Date(),
      'grp_end': grpEnd,
      'grp_waitlist_allowed': true,
      'grp_max_size': 4,
      'grp_max_waitlist': 1,
      'grp_state': 'OPEN',
      'grp_members': [
        { 'user_uuid': 'SUPERMAN',
          'role': 'STUDENT',
          'added_by': 'BATMAN',
          'waitlisted': false},
        { 'user_uuid': 'AQUAMAN',
          'role': 'STUDENT',
          'added_by': 'WONDER WOMAN',
          'waitlisted': true } ]
    },
    {
      'grp_uuid': grpTwoUUID,
      'grp_name': 'Group Two',
      'grp_description': 'Second Group',
      'grp_location': 'Rm 1313',
      'grp_start': new Date(),
      'grp_end': grpEnd,
      'grp_waitlist_allowed': true,
      'grp_max_size': 4,
      'grp_max_waitlist': 1,
      'grp_state': 'OPEN',
      'grp_members': [
        { 'user_uuid': 'HAWKEYE',
          'role': 'STUDENT',
          'added_by': 'BLACKWIDOW',
          'waitlisted': false},
        { 'user_uuid': 'HULK',
          'role': 'STUDENT',
          'added_by': 'BRUCE BANNER',
          'waitlisted': true },
        { 'user_uuid': 'CAPT AMERICA',
          'role': 'STUDENT',
          'added_by': 'IRON MAN',
          'waitlisted': true
        } ]
    } ]
}

var groupThree = {
  'grp_uuid': grpThreeUUID,
  'grp_name': 'Group Three',
  'grp_description': 'Third Group',
  'grp_location': 'Rm 1313',
  'grp_start': new Date(),
  'grp_end': grpEnd,
  'grp_waitlist_allowed': true,
  'grp_max_size': 5,
  'grp_max_waitlist': 2,
  'grp_state': 'OPEN',
  'grp_members': [
    { 'user_uuid': 'THOR',
      'role': 'STUDENT',
      'added_by': 'CAPT AMERICA',
      'waitlisted': false},
    { 'user_uuid': 'IRON MAN',
      'role': 'STUDENT',
      'added_by': 'JARVIS',
      'waitlisted': true },
    { 'user_uuid': 'WOLVERINE',
      'role': 'STUDENT',
      'added_by': 'XAVIER',
      'waitlisted': true
    } ]
}


var groupFour = {
  'grp_uuid': grpFourUUID,
  'grp_name': 'Group Four',
  'grp_description': 'Fourth Group',
  'grp_location': 'Rm 1313',
  'grp_start': new Date(),
  'grp_end': grpEnd,
  'grp_waitlist_allowed': true,
  'grp_max_size': 5,
  'grp_max_waitlist': 2,
  'grp_state': 'OPEN',
  'grp_members': [
    { 'user_uuid': 'THOR',
      'role': 'STUDENT',
      'added_by': 'CAPT AMERICA',
      'waitlisted': false},
    { 'user_uuid': 'IRON MAN',
      'role': 'STUDENT',
      'added_by': 'JARVIS',
      'waitlisted': true },
    { 'user_uuid': 'WOLVERINE ',
      'role': 'STUDENT',
      'added_by': 'XAVIER',
      'waitlisted': true
    } ]
}

var addedUser = {
        'uuid': listUUID3,
        'name': 'This is the minimum Good List',
        'description': 'test post list with minimum data, one user',
        'start': new Date(),
        'max_size': 30,
        'max_waitlist': 3,
        'state': 'OPEN',
        'grp_members': [ 
          { 'user_uuid': 'SUPERMAN',
            'role': 'STUDENT',
            'added_by': 'BATMAN',
            'waitlisted': false},
          { 'user_uuid': 'AQUAMAN',
            'role': 'STUDENT',
            'added_by': 'WONDER WOMAN',
            'waitlisted': true } ]
}

var listToUpdate
var user2Add = { 'user_uuid': 'AQUAMAN', 'role': 'STUDENT', 'added_by': 'WONDER WOMAN', 'waitlisted': true }

// JWT data
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

var thorClaims = {
  'iss': 'SignUp List',
  'system': 'localhost',
  'exp': Math.floor(Date.now() / 1000) + (60 * 60),
  'iat': Date.now(),
  'xsrfToken': xsrfTokenStudent,
  'jti': jtiStudent,
  'sub': 'THOR',
  'userRole': userRoleStudent
}

var wolverineClaims = {
  'iss': 'SignUp List',
  'system': 'localhost',
  'exp': Math.floor(Date.now() / 1000) + (60 * 60),
  'iat': Date.now(),
  'xsrfToken': xsrfTokenStudent,
  'jti': jtiStudent,
  'sub': 'WOLVERINE',
  'userRole': userRoleStudent
}

var hawkeyeClaims = {
  'iss': 'SignUp List',
  'system': 'localhost',
  'exp': Math.floor(Date.now() / 1000) + (60 * 60),
  'iat': Date.now(),
  'xsrfToken': xsrfTokenStudent,
  'jti': jtiStudent,
  'sub': 'HAWKEYE',
  'userRole': userRoleStudent
}

jwtTokenInstructor = jwtUtils.genJWTToken(jwtClaimsInstructor)
jwtTokenStudent = jwtUtils.genJWTToken(jwtClaimsStudent)
var thorToken = jwtUtils.genJWTToken(thorClaims)
var wolverineToken = jwtUtils.genJWTToken(wolverineClaims)
var hawkeyeToken = jwtUtils.genJWTToken(hawkeyeClaims)

jwtUtils.cacheJwtToken(jwtClaimsInstructor.jti, jwtTokenInstructor, jwtClaimsInstructor.exp)
jwtUtils.cacheJwtToken(jwtClaimsStudent.jti, jwtTokenStudent, jwtClaimsStudent.exp)
jwtUtils.cacheJwtToken(thorClaims.jti, thorToken, thorClaims.exp)
jwtUtils.cacheJwtToken(wolverineClaims.jti, wolverineToken, wolverineClaims.exp)
jwtUtils.cacheJwtToken(hawkeyeClaims.jti, hawkeyeToken, hawkeyeClaims.exp)


// POST tests
/*
 * POST /lists to save a new list.
 * * Only accessible by AP roles
 */
describe('[test_list_schema] FAIL on incorrectly formatted POST?', function () {
  it('it should FAIL to POST a list without list_name field', (done) => {
    chai
      .request(server)
      .post('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(badTestNoName)
      .end(function (err, res) {
        if (err) {
          if (debug) console.log('[test_list_schema] should FAIL to POST a list without list_name field')
        }
        expect(res).to.have.err
      })
    done()
  })
  it('it should FAIL to POST a list without list_visible_start and end fields', (done) => {
    chai
      .request(server)
      .post('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(badTestNoDates)
      .end(function (err, res) {
        if (err) {
          if (debug) console.log('[test_list_schema] should FAIL to POST a list without list_visible_start and end fields')
        }
        expect(res).to.have.err
      })
    done()
  })

  it('it should FAIL to POST a list without list_visible_start field', (done) => {
    chai
      .request(server)
      .post('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(badTestNoStartDate)
      .end(function (err, res) {
        if (err) {
          if (debug) console.log('[test_list_schema] should FAIL to POST a list without list_visible_start field')
        }
        expect(res).to.have.err
      })
    done()
  })

  it('it should FAIL to POST a list without list_visible_end field', (done) => {
    chai
      .request(server)
      .post('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(badTestNoEndDate)
      .end(function (err, res) {
        if (err) {
          if (debug) console.log('[test_list_schema] should FAIL to POST a list without list_visible_end field')
        }
        expect(res).to.have.err
      })
    done()
  })
})

describe('[test_list_schema] Pass on correctly formatted POST?', function () {
  it('should POST correctly formatted payload...', (done) => {
    chai
      .request(server)
      .post('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(minimumGoodList)
      .end(function (err, res) {
        if (err) {
          if (debug) console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', minimumGoodList)
        }
        expect(res.status).to.eql('201')
      })
    done()
  })

  it('should POST correctly formatted payload...', (done) => {
    chai
      .request(server)
      .post('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(grpMbrTest)
      .end(function (err, res) {
        if (err) {
          if (debug) console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', grpMbrTest)
        }
        expect(res.status).to.eql('201')
      })
    done()
  })
})

/*
 * POST list with Groups
 */
describe('[test_list_schema] Pass on correctly formatted POST (WITH Groups/No Users)?', function () {
  it('should POST correctly...', (done) => {
    chai
      .request(server)
      .post('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(listGroupsNoUsers)
      .end(function (err, res) {
        if (!err) {
          expect(res.status).to.eql('201')
        }
      })
    done()
  })
})

/*
 * POST list with Groups and Users
 */
describe('[test_list_schema] Pass on correctly formatted POST (WITH Groups and Users)?', function () {
  it('should POST: ' + JSON.stringify(listGroupsWithUsers) + '\n correctly...', (done) => {
    chai
      .request(server)
      .post('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(listGroupsWithUsers)
      .end(function (err, res) {
        if (err) {
          if (debug) console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', listGroupsWithUsers)
        }
        expect(res.status).to.eql(201)
      })
    done()
  })
})

/*
 * GET /lists route to retrieve all the lists.
 * * Accessible by AP and SP roles
 */
describe('[test_list_schema] Return all lists', function () {
  it('should GET all lists correctly...', (done) => {
    chai
      .request(server)
      .get('/lists').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        if (err) {
          console.log('[test_list_schema] GET err:\n', err)
        }
        expect(res.status).to.eql(200)
      })
    done()
  })
})


/*
 * GET /lists/:uuid route to retrieve a single list.
 * * Accessible by AP and SP roles
 */
describe('[test_list_schema] Return what we just created', function () {
  it('should GET ' + listUUID2 + ' correctly...', (done) => {
    chai
      .request(server)
      .get('/lists/' + listUUID2).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        if (err) {
          console.log('[test_list_schema] GET err:\n', err)
        }
        res.body.list_uuid.should.eql(listUUID2)
        expect(res.body.list_description).to.equal('test post list with minimum data - Groups/No Users')
        expect(res.status).to.eql(200)
      })
    done()
  })
})

/*
 * PUT /lists/:list_uuid to fully update a complete list record (use PATCH for partial updates)
 * * Only accessible by AP roles
 */
describe('[test_list_schema] PUT an updated list', function () {
  it('should FAIL update existing list with a group data for SP Role.', (done) => {
    var listToUpdate = listGroupsWithUsers
    // listToUpdate.list_groups.push(groupThree)
    if (debug) console.log('[test_list_schema] Data to PUT on [', listUUID3, '] :\n', listToUpdate)
    chai
      .request(server)
      .put('/lists/' + listUUID3).set('Cookie', 'sulToken=' + jwtTokenStudent)
      .send(listToUpdate)
      .end((err, res) => {
        if (err) {
          if (debug) console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', listGroupsWithUsers)
        }
        expect(res.status).to.eql(403)
      })
    done()
  })

it('should SUCCEED update existing list with a group data for AP Role.', (done) => {
    var listToUpdate = listGroupsWithUsers
    listToUpdate.list_groups.push(groupThree)
    if (debug) console.log('[test_list_schema] Data to PUT on [', listUUID3, '] :\n', listToUpdate)
    chai
      .request(server)
      .put('/lists/' + listUUID3).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(listToUpdate)
      .end((err, res) => {
        if (err) {
          if (debug) console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', listGroupsWithUsers)
        }
        expect(res.status).to.eql(403)
      })
    done()
  })

  it('should get updated list...', (done) => {
    chai
      .request(server)
      .get('/lists/' + listUUID3).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        if (err) {
          console.log('[test_list_schema] GET err:\n', err)
        }
        res.body.list_uuid.should.eql(listUUID3)
        expect(res.status).to.eql(200)
      })
    done()
  })
})

/*
 * PUT /lists/:id/groups - add (create) a list group
 * * Only accessible by AP roles
 */
describe('[test_list_schema] PUT (create) a new group to an existing List', function () {
  it('should create a new group on an existing list.', (done) => {
    if (debug) console.log('[test_list_schema] Group to add to [', listUUID3, '] :\n', groupFour)
    chai
      .request(server)
      .put('/lists/' + listUUID3 + '/groups').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(groupFour)
      .end((err, res) => {
        if (err) {
          if (debug) console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', groupFour)
        }
        expect(res.status).to.eql(200)
      })
    done()
  })

  it('should get updated list...', (done) => {
    chai
      .request(server)
      .get('/lists/' + listUUID3).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        if (err) {
          // console.log('[test_list_schema] GET err:\n', err)
        }
        expect(res.body.list_uuid).to.eql(listUUID3)
        expect(res.status).to.eql(200)
      })
    done()
  })
})

/*
 * PUT /lists/:id/groups/:grpId - fully update a specific list group
 * * Only accessible by AP roles
 */
describe('[test_list_schema] POST a full set of group memberships', function () {
  it('POST should FAIL to post full group list if the requestor Role is SP', (done) => {
    chai
      .request(server)
      .put('/lists/' + listUUID2 + '/groups/' + grpTwoUUID).set('Cookie', 'sulToken=' + jwtTokenStudent)
      .send('{doesnt:matteritshouldfail}')
      .end((err, res) => {
        expect(res.status).to.eql(403)
      })
    done()
  })
  it('POST should SUCCEED to post full group list if the requestor Role is AP', (done) => {
    chai
      .request(server)
      .put('/lists/' + listUUID2 + '/groups/' + grpTwoUUID).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(groupFour)
      .end((err, res) => {
        expect(res.status).to.eql(403)
      })
    done()
  })
})

/*
 * POST /lists/:id/groups/:grpId/members creates set of memberships in a list group
 * * Accessible by AP role
 * * Overwrites existing group memberships
 */
describe('[test_list_schema] POST a full set of group memberships', function () {
  it('POST should FAIL to post full memberships list if the requestor Role is SP', (done) => {
    chai
      .request(server)
      .put('/lists/' + listUUID2 + '/groups/' + grpTwoUUID + '/members').set('Cookie', 'sulToken=' + jwtTokenStudent)
      .send('{doesnt:matteritshouldfail}')
      .end((err, res) => {
        expect(res.status).to.eql(403)
      })
    done()
  })

  it('PUT should SUCCEED to post memberships if the requestor Role is AP', (done) => {

    chai
      .request(server)
      .put('/lists/' + listUUID2 + '/groups/' + grpOneUUID + '/members').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(groupFour)
      .end((err, res) => {
        expect(res.status).to.eql(403)
      })
    done()
  })
})


/*
 * PUT /lists/:id/groups/:grpId/members/:mbrId creates a user in the specified list group
 * * Accessible by AP and SP roles
 * * SP sub must match target or a 403 will be issued
 */
describe('[test_list_schema] PUT a single group membership', function () {
  var newGroupUser = { 'user_uuid': 'WOLVERINE',
    'role': 'STUDENT',
    'added_by': 'WONDER WOMAN',
    'waitlisted': true }

  it('PUT should FAIL to post memberships if the requestor Role is SP and membership user_uuid does not match the poster user_uuid', (done) => {
    chai
      .request(server)
      .put('/lists/' + listUUID2 + '/groups/' + grpTwoUUID + '/members').set('Cookie', 'sulToken=' + jwtTokenStudent)
      .send(newGroupUser)
      .end((err, res) => {
        expect(res.status).to.eql(403)
      })
    done()
  })
  
  it('PUT should SUCCEED to post memberships if the requestor Role is SP and membership user_uuid matches the poster user_uuid', (done) => {
    chai
      .request(server)
      .put('/lists/' + listUUID2 + '/groups/' + grpTwoUUID + '/members').set('Cookie', 'sulToken=' + wolverineToken)
      .send(newGroupUser)
      .end((err, res) => {
        expect(res.status).to.eql(201)
      })
    done()
  })
  
  it('POST should SUCCEED to post memberships if the requestor Role is AP', (done) => {
    chai
      .request(server)
      .put('/lists/' + listUUID4 + '/groups/' + grpTwoUUID + '/members').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(newGroupUser)
      .end((err, res) => {
        expect(res.status).to.eql(201)
      })
    done()
  })
  
})


/*
 * GET /lists/:id/groups/:grpId/members gets users in a list group
 * * Accessible by AP and SP roles
 * * * SP can only retrieve if list.student_view === true
 */
describe('[test_list_schema] Get a single groups memberships', function () {
  it('GET should FAIL to get memberships if the requestor Role is SP and list is set to student_view FALSE', (done) => {
    chai
      .request(server)
      .get('/lists/' + listUUID2 + '/groups/' + grpTwoUUID + '/members').set('Cookie', 'sulToken=' + jwtTokenStudent)
      .end((err, res) => {
        expect(res.status).to.eql(403)
      })
    done()
  })

  it('GET should SUCCEED to get memberships if the requestor Role is SP and list is set to student_view TRUE', (done) => {
      chai
      .request(server)
      .get('/lists/' + listUUID4 + '/groups/' + grpTwoUUID + '/members').set('Cookie', 'sulToken=' + jwtTokenStudent)
      .end((err, res) => {
        expect(res.status).to.eql(200)
      })
    done()
  })

  it('GET should SUCCEED to get memberships if the requestor Role is AP regardless of student_view setting', (done) => {
      chai
      .request(server)
      .get('/lists/' + listUUID3 + '/groups/' + grpOneUUID + '/members').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        expect(res.status).to.eql(200)
      })
    done()
  })
})

/*
 * GET /lists/:id/groups/:grpId/members/:userId gets a specific User in a list group
 * * Accessible by AP and SP roles
 * * SP sub must match target or a 403 will be issued
 */
describe('[test_list_schema] Get a single group membership', function () {
  it('GET should FAIL to get a membership if the requestor Role is SP and the userUUIDs do not match', (done) => {
    var target = 'HAWKEYE'
    chai
      .request(server)
      .get('/lists/' + listUUID3 + '/groups/' + grpTwoUUID + '/members/' + target).set('Cookie', 'sulToken=' + jwtTokenStudent)
      .end((err, res) => {
        expect(res.status).to.eql(403)
      })
    done()
  })

  it('GET should SUCCEED to get a membership if the requestor Role is SP and the userUUIDs match', (done) => {
    var target = 'HAWKEYE'
    chai
      .request(server)
      .get('/lists/' + listUUID3 + '/groups/' + grpTwoUUID + '/members/' + target).set('Cookie', 'sulToken=' + hawkeyeToken)
      .end((err, res) => {
        console.log('SUCCEED (as hawkeye): ', res.body)
        expect(res.status).to.eql(200)
      })
    done()
  })

  it('GET should SUCCEED to get a membership if the requestor Role is AP', (done) => {
    var target = 'SUPERMAN'
    chai
      .request(server)
      .get('/lists/' + listUUID3 + '/groups/' + grpOneUUID + '/members/' + target).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        if (err) {
          // console.log('[test_list_schema] GET err:\n', err)
        }
        console.log('SUCCEED (as instructor): ', res.body)
        expect(res.status).to.eql(200)
      })
    done()
  })

})


/*
 * PUT /lists/:id/groups/:grpId/members/:userId Updates a specific user in a list group
 * * Accessible by AP and SP roles
 * * SP sub must match target or a 403 will be issued
 */
describe('[test_list_schema] UPDATE a single group membership', function () {
  it('UPDATE should FAIL to update a membership if the requestor Role is SP and the userUUIDs do not match', (done) => {
    var membershipForSPUpdate = { 'user_uuid': 'THOR',
      'role': 'STUDENT',
      'added_by': 'CAPT AMERICA',
      'waitlisted': false}
    var target = 'THOR'
    chai
      .request(server)
      .put('/lists/' + listUUID3 + '/groups/' + grpThreeUUID + '/members/' + target).set('Cookie', 'sulToken=' + wolverineToken)
      .send(membershipForSPUpdate)
      .end((err, res) => {
        expect(err)
        expect(res.status).to.eql(403)
      })
    done()
  })

  it('UPDATE should Succeed to update a membership if the requestor Role is SP and the userUUIDs match', (done) => {
    var membershipForSPUpdate = { 'user_uuid': 'THOR',
      'role': 'STUDENT',
      'added_by': 'CAPT AMERICA',
      'waitlisted': true}
    var target = 'THOR'
    chai
      .request(server)
      .put('/lists/' + listUUID3 + '/groups/' + grpThreeUUID + '/members/' + target).set('Cookie', 'sulToken=' + thorToken)
      .send(membershipForSPUpdate)
      .end((err, res) => {
        expect(err)
        expect(res.status).to.eql(200)
      })
    done()
  })

  it('UPDATE should Succeed to update a membership if the requestor Role is AP', (done) => {
    var membershipForAPUpdate = { 'user_uuid': 'TONY STARK',
      'role': 'INSTRUCTOR',
      'added_by': 'JARVIS',
      'waitlisted': false }
    var target = 'IRON MAN'
    chai
      .request(server)
      .put('/lists/' + listUUID3 + '/groups/' + grpThreeUUID + '/members/' + target).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .send(membershipForAPUpdate)
      .end((err, res) => {
        expect(res.status).to.eql(200)
      })
    done()
  })
})

/*
 * DELETE /lists/:id/groups/:grpId/members/:userId deletes a specific user from a list group
 * * Accessible by AP and SP roles
 * * SP sub must match target or a 403 will be issued
 */
describe('[test_list_schema] Delete a list group membership', function () {
  it('should FAIL to delete a membership if the requestor Role is SP and the userUUIDs do not match', (done) => {
    chai
      .request(server)
      .delete('/lists/' + listUUID3 + '/groups/' + grpThreeUUID + '/members/' + 'THOR').set('Cookie', 'sulToken=' + wolverineToken)
      .end((err, res) => {
        expect(res.status).to.eql(403)
      })
    done()
  })
  it('should Succeed to delete a membership if the requestor Role is SP and the userUUIDs match', (done) => {
    chai
      .request(server)
      .delete('/lists/' + listUUID3 + '/groups/' + grpThreeUUID + '/members/' + 'WOLVERINE').set('Cookie', 'sulToken=' + wolverineToken)
      .end((err, res) => {
        expect(res.status).to.eql(204)
      })
    done()
  })
})

/*
 * DELETE /lists/:id/groups/:grpId deletes a list group in it's entirety
 * * Only accessible by AP roles
 */
describe('[test_list_schema] Delete a list group', function () {
  it('should delete what we POSTed as AP Role', (done) => {
    chai
      .request(server)
      .delete('/lists/' + listUUID3 + '/groups/' + groupThree).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        if (!err) {
          expect(res.status).to.eql(204)
        } else {
          console.log('[test_list_schema] Delete a list group error: ', err)
        }
      })
    done()
  })
})

/*
 * DELETE /lists/:id route to delete a single list.
 * * Only accessible by AP roles
 */
describe('[test_list_schema] Delete what we created', function () {
  it('should delete what we POSTed', (done) => {
    chai
      .request(server)
      .delete('/lists/' + listUUID3).set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        if (err) {
          if (debug) console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', listGroupsWithUsers)
        }
        expect(res.status).to.eql(204)
      })
    done()
  })
})

/*
 * DELETE   /lists - Delete all lists
 * * Only accessible by AP roles
 */
describe('[test_list_schema] Delete all lists', function () {
  it('should delete all lists', (done) => {
    chai
      .request(server)
      .delete('/lists/').set('Cookie', 'sulToken=' + jwtTokenInstructor)
      .end((err, res) => {
        if (!err) {
          expect(res.status).to.eql(204)
        } else {
          console.log('[test_list_schema] Delete all lists: error: ', err)
        }
      })
    done()
  })
})

// empty DB after tests
after(function (done) {
  if (debug) console.log('[test_list_schema] Dropping test list collection')
  mongoose.connection.db.dropCollection('lists')
  mongoose.connection.close()
  done()
})
