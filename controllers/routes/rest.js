// var config = require('../../config/config')
var express = require('express')
// var session = require('express-session')

var https = require('https')
// var lti = require('ims-lti')
// var _ = require('lodash')
// var path = require('path')

var tokenjs = require('./token')

// var ltiKey = process.env.LTI_KEY || config.lti_key
// var ltiSecret = process.env.LTI_SECRET || config.lti_secret
// var oauthKey = process.env.OAUTH_KEY || config.oauth_key
// var oauthSecret = process.env.OAUTH_SECRET || config.oauth_secret
// var restHost = process.env.APP_TARGET_URL || config.rest_host
// var restPort = process.env.APP_TARGET_PORT || config.rest_port

var router = express.Router()
var sess

// set false to allow self-signed certs with local Learn
var rejectUnauthorized = false

// var courseUUID = ''
// var userUUID = ''
// var system_guid = ''
// var shared_css = ''
// var return_url = ''
// var user_role = ''

// var valid_session = false

/* Get User Information by UUID. */
router.get('/system/:systemId/user/:userId', function (req, res, next) {
  sess = req.session
  console.log('[REST.JS: get user by UUID]:session.consumer_protocol: ', sess.consumer_protocol)
  console.log('[REST.JS: get user by UUID]:session.consumer_hostname: ', sess.consumer_hostname)
  console.log('[REST.JS: get user by UUID]:session.consumer_port : ', sess.consumer_port)

  var uuid = req.params.userId
  var system = req.params.systemId

  tokenjs.checkToken(system, sess, function (err, token) {
    if (err) console.log(err)
    var authString = 'Bearer ' + token
    console.log('[REST.JS: get user by UUID]: uuid: ' + uuid + ', system: ' + system + ', authString: ' + authString)
    var options = {
      'hostname': sess.consumer_hostname,
      'port': sess.consumer_port,
      'path': '/learn/api/public/v1/users/uuid:' + uuid,
      'method': 'GET',
      'rejectUnauthorized': rejectUnauthorized,
      'headers': { 'Authorization': authString }
    }
    console.log('\n[REST.JS: get user by UUID]: uuid: \n', options)
    var httpReq = https.request(options, function (httpRes) {
      httpRes.setEncoding('utf-8')
      var responseString = ''
      httpRes.on('data', function (data) {
        responseString += data
      })
      httpRes.on('end', function () {
        console.log(responseString)
        var json = JSON.parse(responseString)
        res.json(json)
      })
    })
    httpReq.end()
  })
})

/* Get User Information by UUID. */
router.get('/system/:systemId/user_pk/:userId', function (req, res, next) {
  var pk = req.params.userId
  var system = req.params.systemId
  sess = req.session
  console.log('[REST.JS: get user by UUID]:session.consumer_protocol: ', sess.consumer_protocol)
  console.log('[REST.JS: get user by UUID]:session.consumer_hostname: ', sess.consumer_hostname)
  console.log('[REST.JS: get user by UUID]:session.consumer_port : ', sess.consumer_port)
  tokenjs.checkToken(system, sess, function (err, token) {
    if (err) console.log(err)
    var authString = 'Bearer ' + token
    console.log('[REST.JS: get user by UUID]: pk: ' + pk + ' system: ' + system + ', authString: ' + authString)
    var options = {
      'hostname': sess.consumer_hostname,
      'port': sess.consumer_port,
      'path': '/learn/api/public/v1/users/' + pk + '?fields=uuid',
      'method': 'GET',
      'rejectUnauthorized': rejectUnauthorized,
      'headers': { 'Authorization': authString }
    }
    console.log('[REST.JS: get user by UUID]: uuid: ]', options)
    var httpReq = https.request(options, function (httpRes) {
      httpRes.setEncoding('utf-8')
      var responseString = ''
      httpRes.on('data', function (data) {
        responseString += data
      })
      httpRes.on('end', function () {
        console.log('[REST.JS: get User by UUID]:responseString: \n', responseString)
        var json = JSON.parse(responseString)
        res.json(json)
      })
    })
    httpReq.end()
  })
})

/* Get Course information by UUID. */
router.get('/system/:systemId/course/:courseId', function (req, res, next) {
  var uuid = req.params.courseId
  var system = req.params.systemId

  sess = req.session
  console.log('[REST.JS: get Course Info by UUID]:session.consumer_protocol: ', sess.consumer_protocol)
  console.log('[REST.JS: get Course Info by UUID]:session.consumer_hostname: ', sess.consumer_hostname)
  console.log('[REST.JS: get Course Info by UUID]:session.consumer_port : ', sess.consumer_port)
  tokenjs.checkToken(system, sess, function (err, token) {
    if (err) console.log(err)
    var authString = 'Bearer ' + token
    console.log('[REST.JS: get Course Info by UUID]: \n uuid:' + uuid + ', system: ' + system + ', authString: ' + authString)
    var options = {
      'hostname': sess.consumer_hostname,
      'port': sess.consumer_port,
      'path': '/learn/api/public/v1/courses/uuid:' + uuid + '?fields=uuid,name,ultraStatus',
      'method': 'GET',
      'rejectUnauthorized': rejectUnauthorized,
      'headers': { 'Authorization': authString }
    }
    console.log('[REST.JS: get Course Info by UUID]:options:\n', options)
    var httpReq = https.request(options, function (httpRes) {
      httpRes.setEncoding('utf-8')
      var responseString = ''
      httpRes.on('data', function (data) {
        responseString += data
      })
      httpRes.on('end', function () {
        console.log('[REST.JS: get Course Info by UUID]:responseString: \n', responseString)
        var json = JSON.parse(responseString)
        res.json(json)
      })
    })
    httpReq.end()
  })
})

/* Get Course Roster. Used by Instructor for manually adding users,
 * as well as displaying list members
 */
router.get('/system/:systemId/course/:courseId/roster', function (req, res, next) {
  var uuid = req.params.courseId
  var system = req.params.systemId
  sess = req.session
  console.log('[REST.JS: get Course Roster by UUID]:session.consumer_protocol: ', sess.consumer_protocol)
  console.log('[REST.JS: get Course Roster by UUID]:session.consumer_hostname: ', sess.consumer_hostname)
  console.log('[REST.JS: get Course Roster by UUID]:session.consumer_port : ', sess.consumer_port)

  tokenjs.checkToken(system, sess, function (err, token) {
    if (err) console.log(err)
    var authString = 'Bearer ' + token
    console.log('[REST.JS: get Course Roster by UUID]: \n uuid: ' + uuid + ' system ' + system + ' authString: ' + authString)
    var options = {
      'hostname': sess.consumer_hostname,
      'port': sess.consumer_port,
      'path': '/learn/api/public/v1/courses/uuid:' + uuid + '/users?fields=userId',
      'method': 'GET',
      'rejectUnauthorized': rejectUnauthorized,
      'headers': { 'Authorization': authString }
    }
    console.log('[REST.JS: get Course Roster]:options:\n', options)
    var httpReq = https.request(options, function (httpRes) {
      httpRes.setEncoding('utf-8')
      var responseString = ''
      httpRes.on('data', function (data) {
        responseString += data
      })
      httpRes.on('end', function () {
        console.log(responseString)
        var json = JSON.parse(responseString)
        res.json(json)
      })
    })
    httpReq.end()
  })
})


/* Create Course Group */
router.post('/system/:systemId/course/:courseId/:groupName', function (req, res, next) {
  var uuid = req.params.courseId
  var system = req.params.systemId

  sess = req.session
  console.log('\n[REST.JS: Create Course Group]:session.consumer_protocol: ', sess.consumer_protocol)
  console.log('\n[REST.JS: Create Course Group]:session.consumer_hostname: ', sess.consumer_hostname)
  console.log('\n[REST.JS: Create Course Group]:session.consumer_port : ', sess.consumer_port)

  tokenjs.checkToken(system, sess, function (err, token) {
    if (err) console.log(err)
    var authString = 'Bearer ' + token
    console.log('\n[REST.JS: Create Course Group]: \n uuid: ' + uuid + ' system ' + system + ' authString: ' + authString)
    var group = {
      'name': req.params.groupName,
      'externalId': req.params.groupName
    }
    var options = {
      'hostname': sess.consumer_hostname,
      'port': sess.consumer_port,
      'path': '/learn/api/public/v1/courses/uuid:' + uuid + '/groups',
      'method': 'POST',
      'rejectUnauthorized': rejectUnauthorized,
      'headers': { 'Authorization': authString }
    }
    console.log('\n[REST.JS: Create Course Group]:options:\n', options)
    var httpReq = https.request(options, function (httpRes) {
      httpRes.setEncoding('utf-8')
      var responseString = ''
      httpRes.on('data', function (data) {
        responseString += data
      })
      httpRes.on('end', function () {
        console.log(responseString)
        var json = JSON.parse(responseString)
        res.json(json)
      })
    })
    httpReq.end(group)
  })
})

/* Add Users to Group */
router.post('/system/:systemId/course/:courseId/:groupName/user/:userId', function (req, res, next) {
  var uuid = req.params.courseId
  var groupName = req.params.groupName
  var userId = req.params.userId
  var system = req.params.systemId

  sess = req.session
  console.log('\n[REST.JS: Add Users to Group]:session.consumer_protocol: ', sess.consumer_protocol)
  console.log('\n[REST.JS: Add Users to Group]:session.consumer_hostname: ', sess.consumer_hostname)
  console.log('\n[REST.JS: Add Users to Group]:session.consumer_port : ', sess.consumer_port)

  tokenjs.checkToken(system, sess, function (err, token) {
    if (err) console.log(err)
    var authString = 'Bearer ' + token
    console.log('uuid: ' + uuid + ' system ' + system + ' authString: ' + authString)
    var options = {
      'hostname': sess.consumer_hostname,
      'port': sess.consumer_port,
      'path': '/learn/api/public/v1/courses/uuid:' + uuid + '/groups/externalId:' + groupName + '/users/uuid:' + userId,
      'method': 'POST',
      'rejectUnauthorized': rejectUnauthorized,
      'headers': { 'Authorization': authString }
    }
    console.log('\n[REST.JS: Add Users to Group]:options:\n', options)
    var httpReq = https.request(options, function (httpRes) {
      httpRes.setEncoding('utf-8')
      var responseString = ''
      httpRes.on('data', function (data) {
        responseString += data
      })
      httpRes.on('end', function () {
        console.log(responseString)
        var json = JSON.parse(responseString)
        res.json(json)
      })
    })
    httpReq.end()
  })
})

module.exports = router
