var config = require('../../config/config');

var express = require('express');
var lti = require('ims-lti');
var _ = require('lodash');
var path = require('path');


var lti_key = process.env.LTI_KEY || config.lti_key;
var lti_secret = process.env.LTI_SECRET || config.lti_secret;
var oauth_key = process.env.APP_OAUTH_KEY || config.oauth_key;
var oauth_secret = process.env.APP_OAUTH_SECRET || config.oauth_secret;
var host = process.env.APP_TARGET_URL || config.rest_host;
var port = process.env.APP_TARGET_PORT || config.rest_port;
var db = process.env.MONGO_URI || config.db;

var router = express.Router();

var course_uuid = "";
var user_uuid = "";
var system_guid = "";
var user_role = "";
var return_url = "";

var valid_session = false;

/* key and secret sanity checks - logged on startup */
//if (process.env.DEBUG) {
    console.log('[index.js]: ');
    console.log("process.env.LTI_KEY:: ",process.env.LTI_KEY);
    console.log("process.env.LTI_SECRET:: ",process.env.LTI_SECRET);
    console.log("process.env.APP_OAUTH_KEY:: ",process.env.APP_OAUTH_KEY);
    console.log("process.env.APP_OAUTH_SECRET:: ",process.env.APP_OAUTH_SECRET);
    console.log("process.env.MONGO_URI:: ",process.env.MONGO_URI);
    if (lti_key == config.lti_key) {
        console.log('Using lti_key from config.js:','\x1b[32m',lti_key,'\x1b[0m');
    } else {
        console.log('Using lti_key from process.env:','\x1b[32m',lti_key,'\x1b[0m');
    }

    if (lti_secret == config.lti_secret) {
      console.log('Using lti_secret from config.js:','\x1b[32m',lti_secret,'\x1b[0m');
    } else {
      console.log('Using lti_secret from process.env:','\x1b[32m',lti_secret,'\x1b[0m');
    }

    if (oauth_key == config.oauth_key) {
      console.log('Using oauth_key from config.js:','\x1b[32m',oauth_key,'\x1b[0m');
    } else {
      console.log('Using oauth_key from process.env:','\x1b[32m',oauth_key,'\x1b[0m');
    }

    if (oauth_secret == config.oauth_secret) {
      console.log('Using oauth_secret from config.js:','\x1b[32m',oauth_secret,'\x1b[0m');
    } else {
      console.log('Using oauth_secret from process.env:','\x1b[32m',oauth_secret,'\x1b[0m');
    }

    if (db == config.db) {
      console.log('Using db from config.js:','\x1b[32m',db,'\x1b[0m');
    } else {
      console.log('Using db from process.env:','\x1b[32m',db,'\x1b[0m');
    }
    
    if (host == config.rest_host) {
      console.log('Using rest_host from config.js:','\x1b[32m',host,'\x1b[0m');
    } else {
      console.log('Using rest_host from process.env:','\x1b[32m',host,'\x1b[0m');
    }
    if (port == config.rest_port) {
      console.log('Using rest_port from config.js:','\x1b[32m',port,'\x1b[0m');
    } else {
      console.log('Using rest_port from process.env:','\x1b[32m',port,'\x1b[0m');
    }
//}
/* Return home page from LTI Launch. */
router.post('/lti', function(req, res, next) {
/*
 * POST LTI Launch Received
 */
console.log('In post function - config key/secret: ' + lti_key, lti_secret);
console.log()
  var provider = new lti.Provider(lti_key, lti_secret);
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
           '"user_role" :' +  user_role + ',' +
           '"system_guid" :' +  system_guid + ',' +
           '"return_url" :' +  return_url + ',' +
         '}');

       	 res.sendFile(path.resolve(__dirname + '/../../public/index.html'));
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
