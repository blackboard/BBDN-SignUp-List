'use strict'
var mongoose = require("mongoose");
var List = require('../controllers/models/lists')
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../server')
var config = require('../config/config')
const uuidV1 = require('uuid/v1')
var should = chai.should()
var expect = chai.expect()

// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require("bluebird");

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

const listUUID = uuidV1()

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
var grpOneUUID = uuidV1()
var grpTwoUUID = uuidV1()
var grpThreeUUID = uuidV1()
var grpFourUUID = uuidV1()

var updateListNameJSON = { 'name': 'tsiLtseTamehcStsiLahcom' }
var updatedListName = 'tsiLtseTamehcStsiLahcom'

var listUUID2 = uuidV1()
var listUUID3 = uuidV1()
console.log('****** [test_list_schema] LISTUUID ******: ', listUUID)
console.log('****** [test_list_schema] LISTUUID2 ******: ', listUUID2)

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
    { 'user_uuid': 'WOLVERINE ',
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


// POST tests
describe('[test_list_schema] FAIL on incorrectly formatted POST?', function () {
  it('it should FAIL to POST a list without list_name field', (done) => {
    chai
      .request(server)
      .post('/lists')
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
      .post('/lists')
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
      .post('/lists')
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
      .post('/lists')
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
      .post('/lists')
      .send(minimumGoodList)
      .end(function (err, res) {
        if (err) {
          console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          console.log('[test_list_schema] Data POSTed:\n', minimumGoodList)
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
      .post('/lists')
      .send(listGroupsNoUsers)
      .end(function (err, res) {
        if (err) {
          if (debug) console.log('Pass on correctly formatted POST (WITH Groups/No Users):\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', listGroupsNoUsers)
        }
        expect(res.status).to.eql('201')
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
      .post('/lists')
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
GET All lists test
*/
describe('[test_list_schema] Return all lists', function () {
  it('should GET all lists correctly...', (done) => {
    chai
      .request(server)
      .get('/lists')
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
GET Single List Test
*/
describe('[test_list_schema] Return what we just created', function () {
  it('should GET ' + listUUID2 + ' correctly...', (done) => {
    chai
      .request(server)
      .get('/lists/' + listUUID2)
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
PUT (update) an existing List
*/
describe('[test_list_schema] PUT an updated list', function () {
  it('should update existing list with a group data.', (done) => {
    var listToUpdate = listGroupsWithUsers
    listToUpdate.list_groups.push(groupThree)
    if (debug) console.log('[test_list_schema] Data to PUT on [', listUUID3, '] :\n', listToUpdate)
    chai
      .request(server)
      .put('/lists/' + listUUID3)
      .send(listToUpdate)
      .end((err, res) => {
        if (err) {
          if (debug) console.log('[test_list_schema] Pass on correctly formatted POST:\n', err)
          if (debug) console.log('[test_list_schema] Data POSTed:\n', listGroupsWithUsers)
        }
        expect(res.status).to.eql(200)
      })
    done()
  })

  it('should get updated list...', (done) => {
    chai
      .request(server)
      .get('/lists/' + listUUID3)
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
 * PUT (create) a new group to an existing List
 */
describe('[test_list_schema] PUT (add) a new group to an existing List', function () {
  it('should create a new group on an existing list.', (done) => {
    //listToUpdate = listGroupsWithUsers
    //listToUpdate.groupList.push(groupThree)
    console.log('[test_list_schema] Group to add to [', listUUID3, '] :\n', groupFour)
    chai
      .request(server)
      .put('/lists/' + listUUID3 + '/groups')
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
      .get('/lists/' + listUUID3)
      .end((err, res) => {
        if (err) {
          console.log('[test_list_schema] GET err:\n', err)
        }
        expect(res.body.list_uuid).to.eql(listUUID3)
        expect(res.status).to.eql(200)
      })
    done()
  })
})


/*
 * √ PUT /courses/:id/roster/ - add a complete roster to the SUL course
 *    --- use PUT to add a user to the roster
 *    --- use DELETE to remove a user from the roster
 */
/*describe('[test_course_schema] Pass on correctly POSTing roster?', function () {
  var roster = [ {'user_uuid': 'moneil'}, {'user_uuid': 'shurrey'} ]
  it('should POST correctly', (done) => {
    chai
      .request(server)
      .put('/courses/' + courseUUID1 + '/roster')
      .send(roster)
      .end((err, res) => {
        res.should.have.status(200)
        if (debug) console.log('\n[test_course_schema] POST SUL Course Roster response: \n', res.body)
        done()
      })
  })
})
*/
/*
 * √ PATCH /courses/:id/roster/ - add a user to a roster for the SUL course
 
describe('[test_course_schema] Pass on correctly adding a user to a SUL course roster', function () {
  var usrToAdd = {
    'user_uuid': 'HAWKEYE'
  }

  if (debug) console.log('\n[test_course_schema] PATCH (add) the user ('HAWKEYE') to the roster response: \n',usrToAdd )      

  it('should correctly PUT (add) the user ('HAWKEYE') to the roster.',(done) => {
    chai
      .request(server)
      .patch('/courses/' + course_uuid1 + '/roster')
      .send(usrToAdd)
      .end((err,res) => {
        res.should.have.status(200)
        if (debug) console.log('\n[test_course_schema] PATCH (add) the user ('HAWKEYE') to the roster response: \n',res.body )      
      done()
      })
  })
})
 */

/*
 * √ GET /courses/:id/roster/:user_uuid - gets a specific user from the roster

describe('[test_course_schema] GET specific user from course roster', function () {
  var user = 'HAWKEYE'
    it('should return the requested user_uuid',(done) => {
    chai
      .request(server)
      .get('/courses/'+ course_uuid1 + '/roster/' + user)
      .end((err,res) => {
        res.should.have.status(200)
        //res.should.be.json
        res.body.user_uuid.should.eql('HAWKEYE')
        if (debug) console.log('\n[test_course_schema] GET specific user (HAWKEYE) response\n',res.body )
      done()
    })
  })
})
 */

/*
// GET /courses/:id/roster - gets the roster from a SUL course
describe('[test_course_schema] Return the full roster for course', function () {
  it('should return the course roster containing moneil and shurrey',(done) => {
    chai
      .request(server)
      .get('/courses/' + course_uuid1 + '/roster')
      .end((err,res) => {
        res.should.have.status(200)
        if (debug) console.log('\n[test_course_schema] GET Course roster response\n',res.body )
      done()
    })
  })
})
 */

/*
 * √ DELETE /courses/:id/roster/:user_uuid - delete a user from the roster
 
describe('[test_course_schema] DELETE User from roster', function () {
  it('should delete the specified user (HAWKEYE) from the roster',(done) => {
    chai
      .request(server)
      .delete('/courses/' + course_uuid1 + '/roster/' + 'HAWKEYE')
      .end((err,res) => {
        res.should.not.have.err
        res.should.have.status(200)
        res.body.roster.length.should.be.eql(2)
      })
      done()
  })
})
 */ 

/*
 * √ DELETE /courses/:id/roster - delete a whole roster

describe('[test_course_schema] DELETE roster', function () {
  it('should delete the roster for the requested course',(done) => {
    chai
      .request(server)
      .delete('/courses/' + course_uuid1 + '/roster')
      .end((err,res) => {
        res.should.not.have.err
        res.should.have.status(200)
        res.body.roster.length.should.be.eql(0)
        if (debug) console.log('\n[test_course_schema DELETE roster] Results: :\n',res.body)
      })
      done()
  })
})
 */

// DELETE an existing List
/*describe('[test_list_schema] Delete what we created', function () {
  it('should delete what we POSTed', (done) => {
    chai
      .request(server)
      .delete('/lists/' + listCreatedUUID)
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
*/
// empty DB after tests
/*after(function (done) {
  console.log('[test_list_schema] Dropping test list collection')
  mongoose.connection.db.dropCollection('lists')
  mongoose.connection.close()
  done()
})*/
