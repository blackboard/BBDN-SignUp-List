var express = require('express')
  , http = require('http')
  , os = require('os')
  , path = require('path')
  , mongoose = require('bluebird').promisifyAll(require('mongoose'))
  , Course = require('../models/courses');

var router = express.Router()

const INFINITY = 100000000;
var openConnections = [];

// simple route to register the clients
exports.regListener = function(req, res, next) {

    var courseId = req.params.id;

    console.log("[REGLIS] courseId: " + courseId)

    // set timeout as high as possible
    req.socket.setTimeout(INFINITY);

    // send headers for event-stream connection
    // see spec for more information
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'course_id': courseId
    });

    console.log("[REGLIS] res: " + res.getHeader('course_id'));

    res.write('\n');

    // push this res object to our global variable
    openConnections.push(res);

    console.log("[REGLIS] openConnections: " + openConnections[0].getHeader('course_id'));

    // When the request is closed, e.g. the browser window
    // is closed. We search through the open connections
    // array and remove this connection.
    req.on("close", function() {
        var toRemove;
        for (var j =0 ; j < openConnections.length ; j++) {
            if (openConnections[j] == res) {
                toRemove =j;
                break;
            }
        }
        openConnections.splice(j,1);
        console.log(openConnections.length);
    });
};

setInterval(function() {
    // we walk through each connection
    openConnections.forEach(function(resp) {
      console.log("[FOREACH] resp: " + resp.getHeader('course_id'));
        var d = new Date();
        var course = '';

        var query = Course.find({'uuid' : resp.getHeader('course_id')}).populate('lists')
        query.exec((err, courses) => {
          if (err) {
            course = '{ \'error\' : \'Course Not Found\' }';
            console.log("[FOREACH] writing: " + '{ \'id:\' ' + d.getMilliseconds() + ', \'data\' : ' + course + '}\n\n')
            resp.write('{ \'id:\' ' + d.getMilliseconds() + ', \'data\' : ' + course + '}\n\n');
          }
          else {
            console.log("Pushing courses: " + JSON.stringify(courses[0]));
            course = JSON.stringify(courses[0]);
            console.log("[FOREACH] writing: " + '{ \'id:\' ' + d.getMilliseconds() + ', \'data\' : ' + course + '}\n\n')
            resp.write('{ \'id:\' ' + d.getMilliseconds() + ', \'data\' : ' + course + '}\n\n');
          }
        });
    });

}, 1000);

function createMsg(courseId) {
  var msg = [];

  var query = Course.find({'uuid' : courseId})
  query.exec((err, courses) => {
    if (err) {
      return({ 'error' : 'Course Not Found'});
    }
    else {
      console.log("Pushing courses: " + JSON.stringify(courses[0]));
      return JSON.stringify(courses[0]);
    }
  });
}
