var config = require('../../config/config')
// var db = require('../../config/db')
var express = require('express')
var session = require('cookie-session')
var lti = require('ims-lti')
var _ = require('lodash')
var path = require('path')
var jwt = require('jsonwebtoken')
var uuid = require('uuid')
var jwtUtils = require('./jwtToken')

// const url = require('url').URL

var debug = (config.debugMode === 'true')

var url = require('url')

var ltiKey = process.env.LTI_KEY || config.lti_key
var ltiSecret = process.env.LTI_SECRET || config.lti_secret
var oauthKey = process.env.APP_OAUTH_KEY || config.oauth_key
var oauthSecret = process.env.APP_OAUTH_SECRET || config.oauth_secret
// var restHost = process.env.APP_TARGET_URL || config.rest_host
// var restPort = process.env.APP_TARGET_PORT || config.rest_port
var dbURL = process.env.MONGO_URI || config.db

var router = express.Router()

var courseUUID = ''
var userUUID = ''
var systemGUID = ''
var userRole = ''
var returnURL = ''
var sharedCSS = ''
var bbVer = {};
var launcherURL

var sess
var validSession = false

var jwtClaims
var jwtToken = ''

/*
 * key and secret sanity checks - logged on startup
 */
if (debug) console.log('[index.js]: ')
if (debug) console.log('process.env.LTI_KEY:: ', process.env.LTI_KEY)
if (debug) console.log('process.env.LTI_SECRET:: ', process.env.LTI_SECRET)
if (debug) console.log('process.env.APP_OAUTH_KEY:: ', process.env.APP_OAUTH_KEY)
if (debug) console.log('process.env.APP_OAUTH_SECRET:: ', process.env.APP_OAUTH_SECRET)
if (debug) console.log('process.env.MONGO_URI:: ', process.env.MONGO_URI)
if (debug) {
  if (ltiKey === config.lti_key) {
    console.log('Using lti_key from config.js:', '\x1b[32m', ltiKey, '\x1b[0m')
  } else {
    console.log('Using lti_key from process.env:', '\x1b[32m', ltiKey, '\x1b[0m')
  }

  if (ltiSecret === config.lti_secret) {
    console.log('Using lti_secret from config.js:', '\x1b[32m', ltiSecret, '\x1b[0m')
  } else {
    console.log('Using lti_secret from process.env:', '\x1b[32m', ltiSecret, '\x1b[0m')
  }

  if (oauthKey === config.oauth_key) {
    console.log('Using oauth_key from config.js:', '\x1b[32m', oauthKey, '\x1b[0m')
  } else {
    console.log('Using oauth_key from process.env:', '\x1b[32m', oauthKey, '\x1b[0m')
  }

  if (oauthSecret === config.oauth_secret) {
    console.log('Using oauth_secret from config.js:', '\x1b[32m', oauthSecret, '\x1b[0m')
  } else {
    console.log('Using oauth_secret from process.env:', '\x1b[32m', oauthSecret, '\x1b[0m')
  }

  if (dbURL === config.db) {
    console.log('Using db_URL from config.js:', '\x1b[32m', dbURL, '\x1b[0m')
  } else {
    console.log('Using db_URL from process.env:', '\x1b[32m', dbURL, '\x1b[0m')
  }

/*
  if (restHost === config.rest_host) {
    console.log('Using rest_host from config.js:', '\x1b[32m', restHost, '\x1b[0m')
  } else {
    console.log('Using rest_host from process.env:', '\x1b[32m', restHost, '\x1b[0m')
  }
  if (restPort === config.rest_port) {
    console.log('Using rest_port from config.js:', '\x1b[32m', restPort, '\x1b[0m')
  } else {
    console.log('Using rest_port from process.env:', '\x1b[32m', restPort, '\x1b[0m')
  }

*/
}

/* Return home page from LTI Launch. */
router.post('/lti', function (req, res, next) {
/*
 * POST LTI Launch Received
 */
  if (debug) console.log('[POST_FUNCTION] CONFIG KEY/SECRET: ' + ltiKey + '/' + ltiSecret)

  if (debug) console.log('\n[POST_FUNCTION] request host: ' + req.headers.host)
  if (debug) console.log()

  var provider = new lti.Provider(ltiKey, ltiSecret)
  req.body = _.omit(req.body, '__proto__')


  if (debug) console.log('REQUEST HEADERS: ')
  if (debug) console.log(req.headers)
  if (debug) console.log('\nREQUEST BODY: ')
  if (debug) console.log(req.body)


  if (debug) console.log('\nREQUEST launch_presentation_return_url: ', req.body.launch_presentation_return_url)
  if (debug) console.log('\nREQUEST custom_tc_profile_url: ', req.body.custom_tc_profile_url) // seems to be the only consistent URL returned?

  launcherURL = url.parse(req.body.custom_tc_profile_url, true, true)

  if (debug) console.log('\nLAUNCHER URL PROTOCOL: ', launcherURL.protocol)
  if (debug) console.log('\nLAUNCHER URL HOSTNAME: ', launcherURL.hostname)
  if (debug) console.log('\nLAUNCHER URL PORT: ', launcherURL.port)

  sess = req.session
  sess.consumer_protocol = launcherURL.protocol
  sess.consumer_hostname = launcherURL.hostname
  // Check to see if launch is from DVM, if so default to https and 9877.
  if (launcherURL.hostname === 'localhost' && launcherURL.port === '9876') {
    sess.consumer_protocol = 'https:'
    sess.consumer_port = '9877'
  } else {
    sess.consumer_port = (launcherURL.port === undefined) ? ((launcherURL.protocol === 'https:') ? '443' : '80') : launcherURL.port
  }

  if (debug) console.log('\nsession.consumer_protocol: ', sess.consumer_protocol)
  if (debug) console.log('\nsession.consumer_hostname: ', sess.consumer_hostname)
  if (debug) console.log('\nsession.consumer_port : ', sess.consumer_port)

  if (debug) console.log('\nCHECK REQUEST VALIDITY')

  provider.valid_request(req, function (err, isValid) {
    if (err) {
      console.log('Error in LTI Launch:' + err)
      var err = new Error('Error in LTI launch.')
      err.status = 403
      next(err)
    } else {
      if (!isValid) {
        console.log('\nError: Invalid LTI launch.')
        var err = new Error('Invalid LTI launch.')
        err.status = 422
        next(err)
      } else {
        validSession = true
        courseUUID = req.body['context_id']
        userUUID = req.body['user_id']
        userRole = req.body['roles']
        systemGUID = req.body['tool_consumer_instance_guid']
        returnURL = req.body['launch_presentation_return_url']
        sharedCSS = req.body['ext_launch_presentation_css_url']
        var version = req.body['ext_lms'].split("-")[1];
        bbVer = {
          "major" : version.split(".")[0],
          "minor" : version.split(".")[1],
          "patch" : version.split(".")[2]

        }
        if (returnURL === undefined) {
          returnURL = 'https://' + sess.consumer_hostname + ':' + sess.consumer_port
        }
        if (debug) {
          console.log('\nDETAILS: ')
          console.log('{' +
           '"return_url" : ' + returnURL + ',' +
           '"course_uuid" :' + courseUUID + ',' +
           '"user_uuid" :' + userUUID + ',' +
           '"user_role" :' + userRole + ',' +
           '"system_guid" :' + systemGUID + ',' +
           '"return_url" :' + returnURL + ',' +
           '"bb_version" :' + JSON.stringify(bbVer,null,2) +
         '}')
        }

        /*
         * Use userUUID and userROLES to issue a JWT token
         */
        if (userRole.toLowerCase().includes('instructor')) {
          if (debug) console.log('[userRole]: INSTRUCTOR')
          userRole = 'instructor'
        }
        if (userRole.toLowerCase().includes('teachingassistant')) {
          if (debug) console.log('[userRole]: TEACHING ASSISTANT')
          userRole = 'teachingassistant'
        }
        if (userRole.toLowerCase().includes('grader')) {
          if (debug) console.log('[userRole]: GRADER')
          userRole = 'grader'
        }
        if (userRole.toLowerCase().includes('learner')) {
          if (debug) console.log('[userRole]: LEARNER')
          userRole = 'learner'
        }
        if (userRole.toLowerCase().includes('administrator')) {
          if (debug) console.log('[userRole]: ADMINISTRATOR')
          userRole = 'administrator'
        }


/*
 * jwtClaims:
 *  iss: issuer - in this case the SignUp List
 *  system: system bound to the request eg:www.mount.edu (LTI launch)
 *  exp: token expiry - in this case one hour
 *    expired tokens may be regenerated based on original claims
 *  iat: when the token was issued
 *  xsrfToken: used for preventing xsrf compared to stored token
 *  jti: unique token identifier - used for jwtTokenCache key
 *  sub: subject of the token - the Learn User UUID (LTI launch)
 *  userRole: the user's role (LTI launch)
 */
        jwtClaims = {
          'iss': 'SignUp List',
          'system': launcherURL.hostname,
          'exp': Math.floor(Date.now() / 1000) + (60 * 60),
          'iat': Date.now(),
          'xsrfToken': uuid.v4(),
          'jti': uuid.v4(),
          'sub': userUUID,
          'userRole': userRole
        }

        if (debug) console.log('[jwtClaims]: \n', jwtClaims)
        if (debug) console.log('[jwtSecret]: \n', config.jwtSecret)
        jwtToken = jwt.sign(jwtClaims, config.jwtSecret)
        jwtToken = jwtUtils.genJWTToken(jwtClaims)
        // The jwtToken is passed as a cookie during the redirect to /lti/data
        if (debug) console.log('[jwtToken]: \n', jwtToken)
        res.sendFile(path.resolve(__dirname + '/../../public/index.html'))
      }
    }
  })
})

/* Supply node variables to angular front end
 *
 */
router.get('/lti/data', function (req, res, next) {
  if (!validSession) {
    console.log('No valid session found. Application can only be accessed via LTI.')
    var err = new Error('No valid session found. Application can only be accessed via LTI.')
    err.status = 403
    next(err)

  } else {
    // we have a valid session and a generated token - hand off to cookie and angular
    var ltidata = {
      'course_uuid': courseUUID,
      'user_uuid': userUUID,
      'user_role': userRole,
      'system_guid': systemGUID,
      'rest_host': config.rest_host,
      'rest_port': config.rest_port,
      'shared_css': sharedCSS,
      'return_url': returnURL,
      'bb_version' : bbVer,
      'jwtClaims': JSON.stringify(jwtClaims),
      'jwtToken': jwtToken
    }
    if (debug) console.log('\nCAPTURED LTI DATA: ')
    if (debug) console.log(JSON.stringify(ltidata))

    jwtUtils.cacheJwtToken(jwtClaims.jti, jwtToken, jwtClaims.exp)
    res.cookie('sulToken', jwtToken, { httpOnly: true }) // cookie expires at end of session
    res.json(ltidata)

  }
})

module.exports = router
