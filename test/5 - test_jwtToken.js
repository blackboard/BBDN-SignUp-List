/* global describe, it */
'use strict'

var mongoose = require('mongoose')
// var List = require('../controllers/models/lists')
var chai = require('chai')
// var expect = require('chai').expect
var chaiHttp = require('chai-http')
// var server = require('../server')
var config = require('../config/config')
const uuid = require('uuid')
var jwt = require('jsonwebtoken')
var jwtUtils = require('../controllers/routes/jwtToken.js')

var should = chai.should()
// var expect = chai.expect()

// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require('bluebird')
chai.use(chaiHttp)

// test data
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

// var instructorToken = jwt.sign(jwtClaimsInstructor, config.jwtSecret)
// var studentToken = jwt.sign(jwtClaimsStudent, config.jwtSecret)

// Always use test DB for testing...
// var db = config.test_db
// var debug = (config.debug_mode === 'true')


// jwtToken tests
/*
 * Test that a token/claims can be generated
 */

describe('JWT Util tests', function () {
  describe('Create an "Instructor" token (VISUAL PASS)', function () {
    it('creates an instructor token (VISUAL PASS)', function () {
      jwtTokenInstructor = jwtUtils.genJWTToken(jwtClaimsInstructor)
      console.log('\n[TEST_JWTTOKEN]: gen Instructor Token: claims:', jwtClaimsInstructor)
      console.log('\n[TEST_JWTTOKEN]: gen Instructor Token: token:', jwtTokenInstructor)
    })
  })

  describe('Create a "Student" token (VISUAL PASS)', function () {
    it('creates an instructor token (VISUAL PASS)', function () {
      jwtTokenStudent = jwtUtils.genJWTToken(jwtClaimsStudent)
      console.log('\n[TEST_JWTTOKEN]: gen Student Token: claims:', jwtClaimsStudent)
      console.log('\n[TEST_JWTTOKEN]: gen Student Token: token:', jwtTokenStudent)
   })
  })

/*
 * Test that a token/claims can be cached
 */
  describe('Cache created Instructor token (VISUAL PASS)', function () {
    it('caches an instructor token (VISUAL PASS)', function () {
      jwtUtils.cacheJwtToken(jwtClaimsInstructor.jti, jwtTokenInstructor, jwtClaimsInstructor.exp)
      console.log('\n[TEST_JWTTOKEN]: Cache Instructor Token: jti:', jwtClaimsInstructor.jti)
      console.log('\n[TEST_JWTTOKEN]: Cache Instructor Token: token:', jwtTokenInstructor)
      console.log('\n[TEST_JWTTOKEN]: Cache Instructor Token: exp:', jwtClaimsInstructor.exp)
    })
  })

  describe('Cache created Student token (VISUAL PASS)', function () {
    it('caches an student token (VISUAL PASS)', function () {
      jwtUtils.cacheJwtToken(jwtClaimsStudent.jti, jwtTokenStudent, jwtClaimsStudent.exp)
      console.log('\n[TEST_JWTTOKEN]: Cache Student Token: jti:', jwtClaimsStudent.jti)
      console.log('\n[TEST_JWTTOKEN]: Cache Student Token: token:', jwtTokenStudent)
      console.log('\n[TEST_JWTTOKEN]: Cache Student Token: exp:', jwtClaimsStudent.exp)
    })
  })

/*
 * Test that a token can be retrieved from cache
 */
  describe('Test checkJWTToken Instructor token (VISUAL PASS)', function () {
    it('should return isCached true (VISUAL PASS)', function () {
      jwtUtils.checkJWTToken(jwtTokenInstructor).should.eql(true)
    })
  })

  describe('Test checkJWTToken Student token', function () {
    it('should return isCached true', function () {
      jwtUtils.checkJWTToken(jwtTokenStudent).should.eql(true)
    })
  })

/*
 * Test that a User's Roles can be validated against the incoming token
 */
  // Valid AP role (pass)
  describe('Test checkJWTToken Instructor token (BOOLEAN PASS)', function () {
    it('should return AP Role is valid (BOOLEAN PASS)', function () {
      jwtUtils.jwtValidRole(jwtTokenInstructor, '["AP"]').should.eql(true)
    })
  })

  // Valid AP role (fail)
  describe('Test checkJWTToken Student token (BOOLEAN PASS)', function () {
    it('should return SP Role is invalid (BOOLEAN PASS)', function () {
      jwtUtils.jwtValidRole(jwtTokenStudent, '["AP"]').should.eql(false)
    })
  })

  // Valid SP role (pass)
  describe('Test checkJWTToken Instructor token (BOOLEAN PASS)', function () {
    it('should return AP Role is valid (BOOLEAN PASS)', function () {
      jwtUtils.jwtValidRole(jwtTokenStudent, '["SP"]').should.eql(true)
    })
  })

  // Valid AP/SP role (pass)
  describe('Test checkJWTToken Student token (BOOLEAN PASS)', function () {
    it('should return AP or SP role is valid (BOOLEAN PASS)', function () {
      jwtUtils.jwtValidRole(jwtTokenStudent, '["AP", "SP"]').should.eql(true)
      jwtUtils.jwtValidRole(jwtTokenInstructor, '["AP", "SP"]').should.eql(true)
    })
  })


/*
 * Test that a User's UUID can be retrieved from the incoming token
 */
  // Instructor UUID should be moneilInstructor
  describe('Test jwtGetUserUUID on token (COMPARE PASS)', function () {
    it('should return sub (userUUID) (COMPARE PASS)', function () {
      var userUUID = jwtUtils.jwtGetUserUUID(jwtTokenStudent)
      console.log('\n[TEST_JWTTOKEN]: jwtGetUserUUID Student:', userUUID)
      userUUID.should.eql('moneilStudent')
      userUUID = jwtUtils.jwtGetUserUUID(jwtTokenInstructor)
      console.log('\n[TEST_JWTTOKEN]: jwtGetUserUUID Instructor:', userUUID)
      userUUID.should.eql('moneilInstructor')
    })
  })
})
