var config = require('../../config/config')
var https = require('https')
var jwtSecret = process.env.APP_JWT_SECRET || config.jwtSecret

const NodeCache = require('node-cache')
const jwtTokenCache = new NodeCache()

var debug = (config.debugMode === 'true')

/*
 * Check the cache for a token.
 * decrypt token, extract jti and look up in cache
 * If it exists, the token is still valid.
 * If it does not, return 403 to initiate a new token request.
 */
exports.checkJWTToken = function (token, callback) {
  // if token exists return true
  // if it doesn't return false, caller should issue not authorized and front end should
  // inform user they need to re-launch the application

  // decrypt to get JTI
  var decodedToken = jwt.verify(token, config.jwtSecret)
  console.log('\n[JWTTOKEN.JS:checkJWTToken]: decodedToken:' + decodedToken)
  // check if jti key in cache
  var success = jwtTokenCache.get(decodedToken.jti)

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

  // var tokenFound = false
  // if (success) {
  //   tokenFound = true
  // } else {
    // we have a valid token used for the first time; add to cache
  // }

  console.log('\n[JWTTOKEN.JS:checkJWTToken]: success:' + success)

  return success
}

var validateJwtToken = function (token) {

}

/* Add a token to cache. */
exports.cacheJwtToken = function (jti, token, exp) {
  console.log('\n[JWTTOKEN.JS:cacheJwtToken]: JTI: ' + jti + ', jwtToken: ' + token + ', exp: ' + exp)

  jwtTokenCache.set(jti, token, exp, function (err, success) {
    if (!err && success) {
      console.log('\n[JWTTOKEN.JS:cacheJwtToken]: success: ' +success)
      return success
    } else {
      // fail gracefully === tbd
    }
  })
}
