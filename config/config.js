var env = process.env.NODE_ENV || 'development';

try {
    var keys = require('./keys.js');
} catch (ex) {
    var keys = require('./keys.template.js');
}

//use these when not set by cloud setup or using localhost for dev...
var config = {
  lti_key: process.env.lti_key || keys.lti_key,
  lti_secret: process.env.lti_secret || keys.lti_secret,
  oauth_key: process.env.app_oauth_key || keys.oauth_key,
  oauth_secret: process.env.app_oauth_secret || keys.oauth_secret,
  port: process.env.app_port || 3000,
  host: process.env.app_host || 'localhost',
  rest_host: process.env.app_target_url || 'localhost', //LMS Host Name
  rest_port: process.env.app_target_port || '3000', //LMS Port (may be left blank)
  db: process.env.mongo_uri || 'mongodb://localhost:27017/signuplistdb',
  test_db: 'mongodb://localhost:27017/test_signuplistdb'
};

console.log(config);

module.exports = config;
