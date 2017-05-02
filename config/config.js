var env = process.env.NODE_ENV || 'development'
var keys
try {
  keys = require('./keys.js');
} catch (ex) {
  keys = require('./keys.template.js');
}

// use these when not set by cloud setup or using localhost for dev...
var config = {
  lti_key: keys.lti_key,
  lti_secret: keys.lti_secret,
  oauth_key: keys.oauth_key,
  oauth_secret: keys.oauth_secret,
  jwtSecret: keys.jwt_secret,
  db: 'mongodb://localhost:27017/signuplistdb',
  test_db: 'mongodb://localhost:27017/test_signuplistdb',
  debugMode: 'true'
}

if (config.debugMode === 'true') console.log(config)

module.exports = config

