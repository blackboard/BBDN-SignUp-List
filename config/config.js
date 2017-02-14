var env = process.env.NODE_ENV || 'development';

//use these when not set by cloud setup or using localhost for dev...
var config = {
  lti_key: '12345',
  lti_secret: 'secret',
  oauth_key: 'd03caa33-1095-47b9-bc67-f5cd634430b1',
  oauth_secret: 'QSFClAMu5KmoG8yFbHTi7pjhsseJl4uz',
  port: 3000,
  host: 'localhost',
  rest_host: 'localhost',
  rest_port: '9877',
  db: 'mongodb://localhost:27017/signuplistdb',
  test_db: 'mongodb://localhost:27017/test_signuplistdb'
};

module.exports = config;
