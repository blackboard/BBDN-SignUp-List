var config = require('../config/config');

var express = require('express');
var lti = require('ims-lti');
var _ = require('lodash');
var path = require('path');


var lti_key = process.env.LTI_KEY || config.lti_key;
var lti_secret = process.env.LTI_SECRET || config.lti_secret;
var oauth_key = process.env.OAUTH_KEY || config.oauth_key;
var oauth_secret = process.env.OAUTH_SECRET || config.oauth_secret;

var router = express.Router();

var course_uuid = "";
var user_uuid = "";
var system_guid = "";
var shared_css = "";
var return_url = "";

var valid_session = false;

/* key and secret sanity checks - logged on startup */
if (lti_key == config.lti_key) {
  console.log('Using lti_key from index.js: ');
} else {
  console.log('Using lti_key from process.env: ')
}
console.log(lti_key);

if (lti_secret == config.lti_secret) {
  console.log('Using lti_secret from index.js: ');
} else {
  console.log('Using lti_secret from process.env: ');
}
console.log(lti_secret);

if (oauth_key == config.oauth_key) {
  console.log('Using oauth_key from index.js: ');
} else {
  console.log('Using oauth_key from process.env: ')
}
console.log(oauth_key);

if (oauth_secret == config.oauth_secret) {
  console.log('Using oauth_secret from index.js: ');
} else {
  console.log('Using oauth_secret from process.env: ');
}
console.log(oauth_secret);

/* Return home page from LTI Launch. */
router.post('/lti', function(req, res, next) {
/*
 * POST LTI Launch Received
 */
console.log('In post function - config key/secret: ' + config.lti_key, config.lti_secret);
  var provider = new lti.Provider(config.lti_key, config.lti_secret);
  req.body = _.omit(req.body, '__proto__');

  console.log(req.headers);
  console.log(req.body);

console.log('Check request validity');
  provider.valid_request(req, function(err, isValid) {
     if(err) {
       console.log('Error in LTI Launch:' + err);
        var err = new Error('Error in LTI launch.');
        err.status = 403;
        next(err);
     }
     else {
     	 if (!isValid) {
         console.log('Error: Invalid LTI launch.');
         var err = new Error('Invalid LTI launch.');
         err.status = 422;
         next(err);
       }
       else {
         valid_session = true;

       	 course_uuid = req.body['context_id'];
       	 user_uuid = req.body['user_id'];
         user_role = req.body['roles'];
         system_guid = req.body['tool_consumer_instance_guid'];
       	 return_url = req.body['launch_presentation_return_url'];

       	 if(return_url == undefined) {
      	    return_url = 'https://' + config.rest_host + ':' + config.rest_port;
       	 }

         console.log ('{' +
           '"course_uuid" :' + course_uuid + ',' +
           '"user_uuid" :' +  user_uuid + ',' +
           '"system_guid" :' +  system_guid + ',' +
           '"return_url" :' +  return_url + ',' +
         '}');

       	 res.sendFile(path.resolve(__dirname + '/../public/index.html'));
       }
     }
  });
});

/* Supply node variables to angular front end */
router.get('/lti/data', function(req, res, next) {
  if(!valid_session) {
    console.log('No valid session found. Application can only be accessed via LTI.');
    var err = new Error('No valid session found. Application can only be accessed via LTI.');
    err.status = 403;
    next(err);
  }
  else {

    var ltidata = {
      "course_uuid" : course_uuid,
      "user_uuid" : user_uuid,
      "user_role" : user_role,
      "system_guid" : system_guid,
      "rest_host" : config.rest_host,
      "rest_port" : config.rest_port,
      "return_url" : return_url
    };
    console.log(JSON.stringify(ltidata));
    res.json(ltidata);
  };
});

module.exports = router;
