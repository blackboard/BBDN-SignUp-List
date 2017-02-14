var config = require('../../config/config');

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

//set false to allow self-signed certs with local Learn
var rejectUnauthorized = false;

var course_uuid = "";
var user_uuid = "";
var system_guid = "";
var shared_css = "";
var return_url = "";
var user_role = "";

var valid_session = false;

/* Get User Information by UUID. */
router.get('/system/:systemId/user/:userId', function(req, res, next) {

  var uuid = req.params.userId;
  var system = req.params.systemId;

  tokenjs.checkToken(system, function(err,token) {
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

/* Get User Information by UUID. */
router.get('/system/:systemId/user_pk/:userId', function(req, res, next) {

  var pk = req.params.userId;
  var system = req.params.systemId;

  tokenjs.checkToken(system, function(err,token) {
      if (err) console.log(err);

      var auth_string = 'Bearer ' + token;

    console.log("pk: " + pk + " system " + system + " auth_string: " + auth_string);

      var options = {
              hostname: host,
              port: port,
              path: '/learn/api/public/v1/users/' + pk + '?fields=uuid',
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

/* Get Course information by UUID. */
router.get('/system/:systemId/course/:courseId', function(req, res, next) {

  var uuid = req.params.courseId;
  var system = req.params.systemId;

  tokenjs.checkToken(system, function(err,token) {
      if (err) console.log(err);

      var auth_string = 'Bearer ' + token;

      console.log("uuid: " + uuid + " system " + system + " auth_string: " + auth_string);

      var options = {
              hostname: host,
              port: port,
              path: '/learn/api/public/v1/courses/uuid:' + uuid + '?fields=uuid,name,ultraStatus',
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

/* Get Course Roster. Used by Intrcutor for manually adding users,
 * as well as displaying list members
 */
router.get('/system/:systemId/course/:courseId/roster', function(req, res, next) {

  var uuid = req.params.courseId;
  var system = req.params.systemId;

  tokenjs.checkToken(system, function(err,token) {
      if (err) console.log(err);

      var auth_string = 'Bearer ' + token;

      console.log("uuid: " + uuid + " system " + system + " auth_string: " + auth_string);

      var options = {
              hostname: host,
              port: port,
              path: '/learn/api/public/v1/courses/uuid:' + uuid + '/users?fields=userId',
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

/* Create Course Group */
router.post('/system/:systemId/course/:courseId/:groupName', function(req, res, next) {

  var uuid = req.params.courseId;
  var system = req.params.systemId;

  tokenjs.checkToken(system, function(err,token) {
      if (err) console.log(err);

      var auth_string = 'Bearer ' + token;

      console.log("uuid: " + uuid + " system " + system + " auth_string: " + auth_string);

      var group = {
          "name" : req.params.groupName,
          "externalId" : req.params.groupName
      };

      var options = {
              hostname: host,
              port: port,
              path: '/learn/api/public/v1/courses/uuid:' + uuid + '/groups',
              method: 'POST',
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

      http_req.end(group);

  });
});

/* Add Users to Group */
router.post('/system/:systemId/course/:courseId/:groupName/user/:userId', function(req, res, next) {

  var courseId = req.params.courseId;
  var groupId = req.params.groupName;
  var userId = req.params.userId;
  var system = req.params.systemId;

  tokenjs.checkToken(system, function(err,token) {
      if (err) console.log(err);

      var auth_string = 'Bearer ' + token;

      console.log("uuid: " + uuid + " system " + system + " auth_string: " + auth_string);

      var options = {
              hostname: host,
              port: port,
              path: '/learn/api/public/v1/courses/uuid:' + uuid + '/groups/externalId:' + groupName + '/users/uuid:' + userId,
              method: 'POST',
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

module.exports = router;
