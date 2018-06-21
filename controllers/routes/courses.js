var express = require('express')
var router = express.Router()
var mongoose = require('bluebird').promisifyAll(require('mongoose'))
var Course = require('../models/courses')
var jwtToken = require('./jwtToken')

var config = require('../../config/config')

var debug = (process.env.DEBUG_MODE === 'yes') || (config.debugMode === 'true')

// √ POST /courses to create a new SUL course record
// √ PUT /courses/:id to update a complete course record (use PATCH for partial updates)
// √ GET /courses/:id to retrieve a single SUL course
// √ GET /courses to retrieve a collection of all SUL courses
// √ DELETE /courses/:id - delete existing SUL course
// √ PATCH /courses/:id - partial update of identified course

// Define: Admin Privileges (AP) are set on users with roles of:
//   Instructor or Teaching Assistant - thise entitled to see and manage the list
//   Students do not have AP access
// Define: Student Privileges (SP) are set on users with the Student role
//   Students may only:
//     view lists, view Groups*, Create, Update and Delete only their own group memberships**
//     * Viewing Groups may or may not display group memberhsips other than the Student's based
//         on the privacy setting on lists "sudent_view: true||false

/*
 * POST /courses to create a new SUL course record
 * * Only accessible by AP roles
 */
router.post('/', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (debug) console.log('[COURSES.JS]: post: incomming token: ', token)
  if (jwtToken.jwtValidRole(token, validRoles)) {
    // res.send('post courses requested');
    console.log("New Course: " + JSON.stringify(req.body));
    var newCourse = new Course(req.body)
    // Save it into the DB.
    newCourse.save((err, course) => {
      if (err) {
        console.log("Error saving course. " + JSON.stringify(err));
        if (err.code === '11000') {
          res.status(409).send(err)
        } else if (err.name === 'ValidationError') {
          res.status(400).send(err)
        } else {
          res.send(err)
        }
      } else { // If no errors, send it back to the client
        if (debug) console.log(req.body)
        res.status(201).json(req.body)
      }
    })
  } else {
    res.status(403).send()
  }
})

/*
 * GET /courses to retrieve a collection of all SUL courses
 * * Only accessible by AP roles
 */
router.get('/', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    var query = Course.find({})
    query.exec((err, courses) => {
      if (err) res.send(err)
      // If no errors, send them back to the client
      if (!courses) {
        if (debug) console.log('[courses.js route]: send 204')
        res.sendStatus(204)
      } else {
        if (debug) console.log('send courses')
        res.sendStatus(200).json(courses)
      }
    })
  } else {
    res.status(403).send()
  }
})

/*
 * GET /courses/:id to retrieve a single SUL course
 * * Accessible by AP and SP roles
 */
router.get('/:id', function (req, res, next) {
  // Query the DB and if no errors, return all the systems
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    Course.findOne({'uuid': req.params.id})
    .populate('lists')
    .exec(function (err, course) {
      if (err) res.send(err)
      // If no errors, send them back to the client
      if (!course) {
        if (debug) console.log('[courses.js route]: send 204')
        res.sendStatus(204)
      } else {
        if (debug) console.log('\n[courses.js route] found course: ' + req.params.id + '\n' + course)
        res.status(200).json(course)
      }
    })
  } else {
    res.status(403).send()
  }
})

/* DELETE /:id/lists to delete all course lists
 * * Only accessible by AP roles
 */
router.delete('/:id/lists', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    if (debug) console.log('\n\n[courses.js] DELETE lists from course:  \n', req.params.id)
    Course.findOneAndUpdate({'uuid': req.params.id}, {$set: { 'list': [] }}, {'new': true}, (err, course) => {
      if (debug) console.log('\n\n[courses.js] DELETE (empty) list of Lists: post delete:\n', course)
      if (err) {
        res.status(500).send(err)
      }
      res.status(200).json(course)
    })
  } else {
    res.status(403).send()
  }
})

/*
 * PUT /courses/:id to fully update a complete course record (use PATCH for partial updates)
 * * Only accessible by AP roles
 */
router.put('/:id', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    Course.findOne({uuid: req.params.id}, (err, course) => {
      if (debug) console.log('[courses.js] PUT: course: ' + JSON.stringify(course))
      if (debug) console.log('[courses.js] PUT: UUID: ' + req.params.id)
      if (err) res.send(err)
      Object.assign(course, req.body).save((err, course) => {
        if (err) res.send(err)
        res.status(200).json(course)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * PATCH /courses/:id - partial update of identified course
 * * Only accessible by AP roles
*/
router.patch('/:id/', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    if (debug) console.log('\n\n[courses.js] PATCH course: id \n', req.params.id)
    Course.findOne({'uuid': req.params.id}, function (err, course) {
      if (err) {
        res.status(500).send(err)
      }
      if (debug) console.log('\n\n[courses.js] PATCH course in: \n', req.body)
      if (debug) console.log('\n\n[courses.js] PATCH course: found  \n', course)
      course.uuid = req.body.uuid || course.uuid
      course.externalId = req.body.externalId || course.externalId
      course.lists = req.body.lists || course.lists
      course.ultrafied = req.body.ultrafied || course.ultrafied
      course.created_on = req.body.created_on || course.created_on
      course.updated_on = new Date()
      if (debug) console.log('\n\n[courses.js] PATCH course results: \n', course)
      // Save the updated document back to the database
      course.save(function (err, course) {
        if (err) {
          res.status(500).send(err)
        }
        res.status(200).json(course)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * DELETE /courses/:id - delete existing SUL course
 * * Only accessible by AP roles
 */
router.delete('/:id', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    Course.remove({'uuid': req.params.id}, (err, result) => {
      if (err) {
        res.status(500).send(err)
      }
      res.status(204).send()
    })
  } else {
    res.status(403).send()
  }
})

module.exports = router
