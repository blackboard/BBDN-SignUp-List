var config = require('../../config/config');
var db = require('../../config/db');
var express = require('express');
var session = require('cookie-session');
var lti = require('ims-lti');
var _ = require('lodash');
var path = require('path');

//const url = require('url').URL;

var debug = (config.debug_mode=="true"?true:false);

var url = require('url');

var lti_key = process.env.LTI_KEY || config.lti_key;
var lti_secret = process.env.LTI_SECRET || config.lti_secret;
var oauth_key = process.env.APP_OAUTH_KEY || config.oauth_key;
var oauth_secret = process.env.APP_OAUTH_SECRET || config.oauth_secret;
var rest_host = process.env.APP_TARGET_URL || config.rest_host;
var rest_port = process.env.APP_TARGET_PORT || config.rest_port;
var db_URL = process.env.MONGO_URI || config.db;
var debug_mode = process.env.DEBUG_MODE || config.debug_mode;



var router = express.Router();

var course_uuid = "";
var user_uuid = "";
var system_guid = "";
var user_role = "";
var return_url = "";


var sess;
var valid_session = false;

/* key and secret sanity checks - logged on startup */
//if (process.env.DEBUG) {
    if (debug) console.log('[index.js]: ');
    if (debug) console.log("process.env.LTI_KEY:: ",process.env.LTI_KEY);
    if (debug) console.log("process.env.LTI_SECRET:: ",process.env.LTI_SECRET);
    if (debug) console.log("process.env.APP_OAUTH_KEY:: ",process.env.APP_OAUTH_KEY);
    if (debug) console.log("process.env.APP_OAUTH_SECRET:: ",process.env.APP_OAUTH_SECRET);
    if (debug) console.log("process.env.MONGO_URI:: ",process.env.MONGO_URI);
    if (debug) {
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

    if (db_URL == config.db) {
      console.log('Using db_URL from config.js:','\x1b[32m',db_URL,'\x1b[0m');
    } else {
      console.log('Using db_URL from process.env:','\x1b[32m',db_URL,'\x1b[0m');
    }

    if (rest_host == config.rest_host) {
      console.log('Using rest_host from config.js:','\x1b[32m',rest_host,'\x1b[0m');
    } else {
      console.log('Using rest_host from process.env:','\x1b[32m',rest_host,'\x1b[0m');
    }
    if (rest_port == config.rest_port) {
      console.log('Using rest_port from config.js:','\x1b[32m',rest_port,'\x1b[0m');
    } else {
      console.log('Using rest_port from process.env:','\x1b[32m',rest_port,'\x1b[0m');
    }

  }

/* Return home page from LTI Launch. */
router.post('/lti', function(req, res, next) {
/*
 * POST LTI Launch Received
 */
  if (debug) console.log('[POST_FUNCTION] CONFIG KEY/SECRET: ' + lti_key + '/' + lti_secret);

  if (debug) console.log('\n[POST_FUNCTION] request host: ' + req.headers.host);
  if (debug) console.log();

  var provider = new lti.Provider(lti_key, lti_secret);
  req.body = _.omit(req.body, '__proto__');


  if (debug) console.log("REQUEST HEADERS: ");
  if (debug) console.log(req.headers);
  if (debug) console.log("\nREQUEST BODY: ");
  if (debug) console.log(req.body);
  
  if (debug) console.log("\nREQUEST launch_presentation_return_url: ", req.body.launch_presentation_return_url);
  if (debug) console.log("\nREQUEST custom_tc_profile_url: ", req.body.custom_tc_profile_url); //seems to be the only consistent URL returned?



  //var launcherURL = new url(req.body.launch_presentation_return_url);

  var launcherURL = url.parse(req.body.custom_tc_profile_url, true, true);

  if (debug) console.log("\nLAUNCHER URL PROTOCOL: ", launcherURL.protocol);
  if (debug) console.log("\nLAUNCHER URL HOSTNAME: ", launcherURL.hostname);
  if (debug) console.log("\nLAUNCHER URL PORT: ", launcherURL.port);

  sess = req.session;
  sess.consumer_protocol=launcherURL.protocol;
  sess.consumer_hostname=launcherURL.hostname;

  /*
   figure out a way to exit gracefully if heroku is called from localhost

  if (( sess.consumer_hostname == 'localhost' ) && !process.env.DEVELOPMENT )) {
    //throw http error 400 with a result....
  }
  */

  // Check to see if launch is from DVM, if so default to https and 9877.
  if(launcherURL.hostname == 'localhost' && launcherURL.port == '9876') {
    sess.consumer_protocol='https:';
    sess.consumer_port='9877';
  } else {
    sess.consumer_port=(launcherURL.port == undefined) ? ((launcherURL.protocol == 'https:')?'443':'80'):launcherURL.port;
  }

  if (debug) console.log("\nsession.consumer_protocol: ", sess.consumer_protocol);
  if (debug) console.log("\nsession.consumer_hostname: ", sess.consumer_hostname);
  if (debug) console.log("\nsession.consumer_port : ", sess.consumer_port);

  if (debug) console.log('\nCHECK REQUEST VALIDITY');

  provider.valid_request(req, function(err, isValid) {
     if(err) {
        console.log('Error in LTI Launch:' + err);
        var err = new Error('Error in LTI launch.');
        err.status = 403;
        next(err);
     }
     else {
     	 if (!isValid) {
         console.log('\nError: Invalid LTI launch.');
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
      	    return_url = 'https://' + sess.consumer_hostname + ':' + sess.consumer_port;
       	 }
         if (debug) {
         console.log('\nDETAILS: ');
         console.log ('{' +
           '"return_url" : ' + return_url + ',' +
           '"course_uuid" :' + course_uuid + ',' +
           '"user_uuid" :' +  user_uuid + ',' +
           '"user_role" :' +  user_role + ',' +
           '"system_guid" :' +  system_guid + ',' +
           '"return_url" :' +  return_url + ',' +
         '}');
         }

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
      "return_url" : return_url,
      "debug_mode" : debug_mode
    };
    if (debug) console.log('\nCAPTURED LTI DATA: ');
    if (debug) console.log(JSON.stringify(ltidata));
    res.json(ltidata);
  };
});

module.exports = router;
