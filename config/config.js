var env = process.env.NODE_ENV || 'development';

try {
    var keys = require('./keys.js');
} catch (ex) {
    var keys = require('./keys.template.js');
}

//use these when not set by cloud setup or using localhost for dev...
var config = {
  lti_key: keys.lti_key,
  lti_secret: keys.lti_secret,
  oauth_key: keys.oauth_key,
  oauth_secret: keys.oauth_secret,
  port: 3000,
  host: 'localhost',
  rest_host: 'localhost', //LMS Host Name
  rest_port: '3000', //LMS Port (may be left blank)
  db: 'mongodb://localhost:27017/signuplistdb',
  test_db: 'mongodb://localhost:27017/test_signuplistdb'
};

module.exports = config;
