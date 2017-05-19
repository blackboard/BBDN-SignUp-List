var config = require('../../config/config')
var https = require('https')
var oauthKey = process.env.APP_OAUTH_KEY || config.oauth_key
var oauthSecret = process.env.APP_OAUTH_SECRET || config.oauth_secret

const NodeCache = require('node-cache')
const tokenCache = new NodeCache()

// set false to allow self-signed certs with local Learn
var rejectUnauthorized = false
var debug = (config.debugMode === 'true')

/*
 * Check the cache for a token based on system Id.
 * If it exists, the token is still valid.
 * If it does not, return 403 to initiate a new token request.
 */
exports.checkToken = function (systemId, session, callback) {
  console.log('\n[TOKEN.JS:getToken]: session.consumer_protocol: ', session.consumer_protocol)
  console.log('\n[TOKEN.JS:getToken]: session.consumer_hostname: ', session.consumer_hostname)
  console.log('\n[TOKEN.JS:getToken]: session.consumer_port : ', session.consumer_port)

  var token = tokenCache.get(systemId)
  var success = ''
  console.log('\n[TOKEN.JS.checkToken]: Token=' + token)
  if (token) {
    if (callback) callback(null, token)
  } else {
    getToken(session, function (err, token) {
      if (err) console.log(err)
      token['systemId'] = systemId
      success = cacheToken(token)
      if (success && debug) console.log('[TOKEN.JS:getToken]: Token cached successfully')
      if (callback) callback(null, token.access_token)
    })
  }
}

/* Get a token from Learn */
var getToken = function (session, callback) {
  var authHash = new Buffer(oauthKey + ':' + oauthSecret).toString('base64')

  var authString = 'Basic ' + authHash

  // console.log("\n[TOKEN.JS:getToken]: oauth_host: " + rest_host + ", port: " + rest_port + ", auth_hash: " + authHash + ", auth_string: " + authString);
  console.log('\n[TOKEN.JS:getToken]: session.consumer_protocol: ', session.consumer_protocol)
  console.log('\n[TOKEN.JS:getToken]: session.consumer_hostname: ', session.consumer_hostname)
  console.log('\n[TOKEN.JS:getToken]: session.consumer_port : ', session.consumer_port)
  var options = {
    'hostname': session.consumer_hostname,
    'port': session.consumer_port,
    'path': '/learn/api/public/v1/oauth2/token',
    'method': 'POST',
    'rejectUnauthorized': rejectUnauthorized,
    'headers': { 'Authorization': authString, 'Content-Type': 'application/x-www-form-urlencoded' }
  }
  console.log('\n[TOKEN.JS:getToken.options]: \n', options)
  var httpReq = https.request(options, function (httpRes) {
    httpRes.setEncoding('utf-8')
    var responseString = ''
    httpRes.on('data', function (data) {
      responseString += data
    })
    httpRes.on('end', function () {
      console.log('\n[TOKEN.JS:getToken.repsonseString]: ' + responseString)
      var json = JSON.parse(responseString)
      var accessToken = json['access_token']
      var tokenType = json['token_type']
      var expiresIn = json['expires_in']
      console.log('\n[TOKEN.JS:getToken]: Access Token: ' + accessToken + ' Token Type: ' + tokenType + ' Expires In: ' + expiresIn)
      callback(null, {'access_token': accessToken, 'expires_in': expiresIn})
    })
  })
  var grant = 'grant_type=client_credentials'
  httpReq.write(grant)
  httpReq.end()
}

/* Add a token to cache. */
var cacheToken = function (token, callback) {
  var ttl = token.expires_in
  var accessToken = token.access_token
  var system = token.systemId

  console.log('\n[TOKEN.JS:cacheToken]: { TTL: ' + ttl + ' }, { access_token: ' + accessToken + ' }')

  var success = tokenCache.set(system, accessToken, ttl)

  return success
}
