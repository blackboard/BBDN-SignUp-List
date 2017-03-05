var config = require('../../config/config');

var express = require('express');
//var session = require('express-session');
var https = require('https');
var lti = require('ims-lti');
var _ = require('lodash');
var path = require('path');

var lti_key = process.env.LTI_KEY || config.lti_key;
var lti_secret = process.env.LTI_SECRET || config.lti_secret;
var oauth_key = process.env.APP_OAUTH_KEY || config.oauth_key;
var oauth_secret = process.env.APP_OAUTH_SECRET || config.oauth_secret;
var rest_host = process.env.APP_TARGET_URL || config.rest_host;
var rest_port = process.env.APP_TARGET_PORT || config.rest_port;

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


/**
  * Check the cache for a token based on system Id.
  * If it exists, the token is still valid.
  * If it does not, return 403 to initiate a new token request.
  */
exports.checkToken = function(systemId, session, callback) {
  console.log("\n[TOKEN.JS:getToken]: session.consumer_protocol: ", session.consumer_protocol);
  console.log("\n[TOKEN.JS:getToken]: session.consumer_hostname: ", session.consumer_hostname);
  console.log("\n[TOKEN.JS:getToken]: session.consumer_port : ", session.consumer_port);

  var token = tokenCache.get( systemId );
    console.log('\n[TOKEN.JS.checkToken]: Token=' + token);
    if(token) {
      if (callback) callback (null, token);
    } else {
      getToken(session, function(err,token) {
        if(err) console.log(err);
        token['systemId'] = systemId;

        success = cacheToken(token);

        if (callback) callback (null, token.access_token);
      });

    }
};

/* Get a token from Learn */
getToken = function (session, callback) {
  var auth_hash = new Buffer(oauth_key + ":" + oauth_secret).toString('base64')

  var auth_string = 'Basic ' + auth_hash;

  console.log("\n[TOKEN.JS:getToken]: oauth_host: " + rest_host + ", port: " + rest_port + ", auth_hash: " + auth_hash + ", auth_string: " + auth_string);

  
  console.log("\n[TOKEN.JS:getToken]: session.consumer_protocol: ", session.consumer_protocol);
  console.log("\n[TOKEN.JS:getToken]: session.consumer_hostname: ", session.consumer_hostname);
  console.log("\n[TOKEN.JS:getToken]: session.consumer_port : ", session.consumer_port);

    var options = {
            hostname: session.consumer_hostname,
            port: session.consumer_port,
            path: '/learn/api/public/v1/oauth2/token',
            method: 'POST',
            rejectUnauthorized: rejectUnauthorized,
            headers: { "Authorization" : auth_string , "Content-Type" : "application/x-www-form-urlencoded" }
    };

    console.log("\n[TOKEN.JS:getToken.options]: \n", options);

    var http_req = https.request(options, function(http_res) {
        http_res.setEncoding('utf-8');
        var responseString = '';
        http_res.on('data', function(data) {
            responseString += data;
        });
        http_res.on('end', function() {
            console.log("\n[TOKEN.JS:getToken.repsonseString]: " + responseString);
            var json = JSON.parse(responseString);
            access_token = json['access_token'];
            token_type = json['token_type'];
            expires_in = json['expires_in'];

            console.log("\n[TOKEN.JS:getToken]: Access Token: " + access_token + " Token Type: " + token_type + " Expires In: " + expires_in);

            callback(null, {'access_token' : access_token, 'expires_in' : expires_in});

        });
    });

    var grant = "grant_type=client_credentials";

    http_req.write(grant);
    //console.log(http_req);
    http_req.end();

};

/* Add a token to cache. */
cacheToken = function(token) {

  var ttl = token.expires_in;
  var access_token = token.access_token;
  var system = token.systemId;

  console.log('\n[TOKEN.JS:cacheToken]: { TTL: ' + ttl + ' }, { access_token: ' + access_token + ' }')

  success = tokenCache.set( system, access_token, ttl );

  return success;
};
