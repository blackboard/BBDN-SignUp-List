var config = require('../config/config');

var express = require('express');
var https = require('https');
var lti = require('ims-lti');
var _ = require('lodash');
var path = require('path');

var tokenjs = require('./token');


var lti_key = process.env.LTI_KEY || config.lti_key;
var lti_secret = process.env.LTI_SECRET || config.lti_secret;
var oauth_key = process.env.OAUTH_KEY || config.oauth_key;
var oauth_secret = process.env.OAUTH_SECRET || config.oauth_secret;
var host = process.env.REST_HOST || config.rest_host;
var port = process.env.REST_PORT || config.rest_port;

var router = express.Router();

const NodeCache = require( "node-cache" );
const tokenCache = new NodeCache();

//set false to allow self-signed certs with local Learn
var rejectUnauthorized = false;

var course_uuid = "";
var user_uuid = "";
var system_guid = "";
var shared_css = "";
var return_url = "";
var user_role = "";

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

if (host == config.host) {
  console.log('Using host from index.js: ');
} else {
  console.log('Using host from process.env: ');
}
console.log(host);

if (host == config.rest_host) {
  console.log('Using rest_host from index.js: ');
} else {
  console.log('Using rest_host from process.env: ');
}
console.log(host);

if (port == config.rest_port) {
  console.log('Using rest_port from index.js: ');
} else {
  console.log('Using rest_port from process.env: ');
}
console.log(port);

/**
  * Request a token from Blackboard
  * Return the token
  */
router.get('/oauth/token/:systemId', function(req, res, next) {
  var token = {};

  getToken(function(err,token) {
    if(err) console.log(err);
    token['systemId'] = req.params.systemId;

    success = cacheToken(token);

    res.json(token);
  });
});

/* Add a token to cache. */
router.get('/system/:systemId/user/:userId', function(req, res, next) {

  var uuid = req.params.userId;
  var system = req.params.systemId;

  checkToken(system, function(err,token) {
      if (err) console.log(err);

      var auth_string = 'Bearer ' + token;

    console.log("uuid: " + uuid + " system " + system + " auth_string: " + auth_string);

      var options = {
              hostname: host,
              port: port,
              path: '/learn/api/public/v1/users/uuid:' + uuid,
              method: 'GET',
              rejectUnauthorized: rejectUnauthorized,
              headers: { "Authorization" : auth_string }
      };

      console.log(options);

      var http_req = https.request(options, function(http_res) {
          http_res.setEncoding('utf-8');
          var responseString = '';
          http_res.on('data', function(data) {
              responseString += data;
          });
          http_res.on('end', function() {
              console.log(responseString);
              var json = JSON.parse(responseString);

              res.json(json);

          });
      });

      http_req.end();
    });
});

/* Add a token to cache. */
router.get('/system/:systemId/course/:courseId', function(req, res, next) {

  var uuid = req.params.courseId;
  var system = req.params.systemId;

  checkToken(system, function(err,token) {
      if (err) console.log(err);

      var auth_string = 'Bearer ' + token;

      console.log("uuid: " + uuid + " system " + system + " auth_string: " + auth_string);

      var options = {
              hostname: host,
              port: port,
              path: '/learn/api/public/v1/courses/uuid:' + uuid,
              method: 'GET',
              rejectUnauthorized: rejectUnauthorized,
              headers: { "Authorization" : auth_string }
      };

      console.log(options);

      var http_req = https.request(options, function(http_res) {
          http_res.setEncoding('utf-8');
          var responseString = '';
          http_res.on('data', function(data) {
              responseString += data;
          });
          http_res.on('end', function() {
              console.log(responseString);
              var json = JSON.parse(responseString);

              res.json(json);

          });
      });

      http_req.end();

  });
});

var getToken = function (callback) {
  var auth_hash = new Buffer(oauth_key + ":" + oauth_secret).toString('base64')

  var auth_string = 'Basic ' + auth_hash;

  console.log("oauth_host: " + host + " auth_hash: " + auth_hash + " auth_string: " + auth_string);

    var options = {
            hostname: host,
            port: port,
            path: '/learn/api/public/v1/oauth2/token',
            method: 'POST',
            rejectUnauthorized: rejectUnauthorized,
            headers: { "Authorization" : auth_string , "Content-Type" : "application/x-www-form-urlencoded" }
    };

    console.log(options);

    var http_req = https.request(options, function(http_res) {
        http_res.setEncoding('utf-8');
        var responseString = '';
        http_res.on('data', function(data) {
            responseString += data;
        });
        http_res.on('end', function() {
            console.log(responseString);
            var json = JSON.parse(responseString);
            access_token = json['access_token'];
            token_type = json['token_type'];
            expires_in = json['expires_in'];

            console.log("Access Token: " + access_token + " Token Type: " + token_type + " Expires In: " + expires_in);

            callback(null, {'access_token' : access_token, 'expires_in' : expires_in});

        });
    });

    var grant = "grant_type=client_credentials";

    http_req.write(grant);
    //console.log(http_req);
    http_req.end();

};

/**
  * Check the cache for a token based on system Id.
  * If it exists, the token is still valid.
  * If it does not, return 403 to initiate a new token request.
  */
checkToken = function(systemId, callback) {

  var token = tokenCache.get( systemId );
    console.log('Token=' + token);
    if(token) {
      callback (null, token);
    } else {
      getToken(function(err,token) {
        if(err) console.log(err);
        token['systemId'] = systemId;

        success = cacheToken(token);

        callback (null,token.access_token);
      });

    }
};

/* Add a token to cache. */
cacheToken = function(token) {

  var ttl = token.expires_in;
  var access_token = token.access_token;
  var system = token.systemId;

  console.log('{ TTL: ' + ttl + ' }, { access_token: ' + access_token + ' }')

  success = tokenCache.set( system, access_token, ttl );

  return success;
};

module.exports = router;
