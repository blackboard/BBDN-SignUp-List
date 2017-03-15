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
  db: 'mongodb://localhost:27017/signuplistdb',
  test_db: 'mongodb://localhost:27017/test_signuplistdb'
};

console.log(config);

module.exports = config;
