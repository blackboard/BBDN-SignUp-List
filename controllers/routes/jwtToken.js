// @ts-check

// var jwtTokenUtil = module.exports = {}
var config = require('../../config/config')
// var https = require('https')
var jwt = require('jsonwebtoken')
var jwtSecret = process.env.APP_JWT_SECRET || config.jwtSecret

const NodeCache = require('node-cache')
const jwtTokenCache = new NodeCache()

var debug = (config.debugMode === 'true')

// var exports = module.exports = {};

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

/*
 * Generate Token
 * Take claims and generate a token, cache, and return
 */
exports.genJWTToken = function (claims) {
  var token = jwt.sign(claims, jwtSecret)
  return token
}

/*
 * Check the cache for a token.
 * decrypt token, extract jti and look up in cache
 * If it exists, the token is still valid return true
 * If it does not, return false.
 */
exports.checkJWTToken = function (token) {
  // if token exists return true
  // if it doesn't return false, caller should issue not authorized and front end should
  // inform user they need to re-launch the application

  // decrypt to get JTI
  var decodedToken = jwt.verify(token, config.jwtSecret)
  var isCached = false
  if (debug) console.log('\n[JWTTOKEN.JS:checkJWTToken]: decodedToken: %j', decodedToken)
  if (debug) console.log('\n[JWTTOKEN.JS:checkJWTToken]: jti:', decodedToken.jti)
  // check if jti key in cache
  // var jti = jwtTokenCache.get(decodedToken.jti)

  if (jwtTokenCache.get(decodedToken.jti)) {
    if (debug) console.log('\n[JWTTOKEN.JS:checkJWTToken]: Token found in cache')
    isCached = true
  } else {
    if (debug) console.log('\n[JWTTOKEN.JS:checkJWTToken]: Token not found in cache')
    isCached = false
  }

  return isCached
}

/*
 *  jwtValidRole takes a token and a Role list and validates the token role
 *  against the Role list
 *  returns true if the token role is in the list
 *  userRole: subject of the token - the Learn User UUID (LTI launch)
 *    valid userRoles: 'instructor', 'teachingassistant', 'grader', 'learner', 'administrator'
 */
exports.jwtValidRole = function (token, roles) {
  var validRole = false
  var decodedToken = jwt.verify(token, config.jwtSecret)
  var role
  if (this.checkJWTToken(token)) {
    // good token how about role?
    // valid userRoles: 'instructor', 'teachingassistant', 'grader', 'learner', 'administrator'
    if (decodedToken.userRole.includes('instructor') ||
        decodedToken.userRole.includes('teachingassistant') ||
        decodedToken.userRole.includes('grader') ||
        decodedToken.userRole.includes('administrator')) {
      role = 'AP'
      if (debug) console.log('\n[jwtToken:jwtValidRole]: Role: ', role)
    } else {
      role = 'SP'
    }
    if (roles.includes(role)) {
      validRole = true
    } else {
      validRole = false
    }
  } else {
    console.log('\n[jwtToken:jwtValidRole]: Error validating token. Token: ', token)
    validRole = false
  }

  return validRole
}

exports.jwtGetRole = function (token) {
  var decodedToken = jwt.verify(token, config.jwtSecret)
  var role
  if (this.checkJWTToken(token)) {
    // good token how about role?
    // valid userRoles: 'instructor', 'teachingassistant', 'grader', 'learner', 'administrator'
    if (decodedToken.userRole.includes('instructor') ||
        decodedToken.userRole.includes('teachingassistant') ||
        decodedToken.userRole.includes('grader') ||
        decodedToken.userRole.includes('administrator')) {
      role = 'AP'
      if (debug) console.log('\n[jwtToken:jwtValidRole]: Role: ', role)
    } else {
      role = 'SP'
    }
  } else {
    console.log('\n[jwtToken:jwtValidRole]: Error validating token. Token: ', token)
  }
  return role
}

exports.jwtGetUserUUID = function (token) {
  // get and validate the token, extract the roles, validate roles
  // return the token user
  var decodedToken = jwt.verify(token, config.jwtSecret)

  return decodedToken.sub
}

/* Add a token to cache. */
exports.cacheJwtToken = function (jti, token, exp) {
  if (debug) console.log('\n[JWTTOKEN.JS:cacheJwtToken]: JTI: ' + jti + ', jwtToken: ' + token + ', exp: ' + exp)

  jwtTokenCache.set(jti, token, exp, function (err, success) {
    if (!err && success) {
      if (debug) console.log('\n[JWTTOKEN.JS:cacheJwtToken]: success: ' + success)
      return success
    } else {
      // fail gracefully === tbd
    }
  })
}

