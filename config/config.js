var env = process.env.NODE_ENV || 'development';

//use these when not set by cloud setup or using localhost for dev...
var config = { 
  lti_key: '54321',  
  lti_secret: 'terces',
  oauth_key: 'your-oauth-key',
  oauth_secret: 'your-oauth-secret',
  port: 3000,
  host: 'localhost',
  db: 'mongodb://localhost:27017/signuplistdb',
  test_db: 'mongodb://localhost:27017/test_signuplistdb'
};

module.exports = config;
