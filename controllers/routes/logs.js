var express = require('express');
var router = express.Router();
//var mongoose = require('mongoose');
var Log = require('../models/logs');
var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var config = require('../../config/config')
var debug = (config.debugMode === 'true')

if (debug) mongoose.set('debug', true);

var url = require('url');

/*
{   uuid: { type: String, required: true, unique: true },
    course_uuid: { type: String, required: true },
    logged_on: Date,
    action_by: { type: String, required: true },
    action_on: String,
    action: {
        type: String,
        enum: ['list_add', 'list_remove', 'waitlist_add', 'waitlist_remove', 'list_created', 'list_removed'],
    },
    comment: String
}
*/

/*
 * POST /logs to save a new log.
 */
router.post('/', function(req, res, next) {
    //console.log("req.body.json: " + JSON.stringify(req.body, null, 4));
    var newLog = new Log(req.body);

    //Save it into the DB.
    newLog.save((err, log) => {
        if(err) {
            if (err.code == '11000') { res.status(409).send(err); }
            else if ( err.name == "ValidationError" ) {
                res.status(400).send(err); 
            }
            else { res.send(err); }
        }
        else { //If no errors, send it back to the client
           //console.log(req.body);
           res.status(201).json(req.body);
        }
    });
});


/*
 * GET /logs route to retrieve all the logs.
 * ?before=DATE returns all the logs before a specific DATE
 * ?after=DATE returns all the logs after a specific DATE  
 */
router.get('/', function(req, res, next) {
    var query = Log.find({});
    query.exec((err, logs) => {
        if(err) res.send(err);
        //If no errors, send the result back to the client
        res.json(logs);
    });
});

/*
 * GET /logs/:log_id route to retrieve a single log.
 */
router.get('/:id', function(req, res, next) {
    //Query the DB and if no errors, return a specific log :id
    Log.findOne({uuid: req.params.id}, (err, log) => {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(log);
    });
});

/*
 * GET /logs/:id
 * returns all the logs for a specific course
 * ?before=ISODate returns all the logs before a specific DATE
 * ?after=ISODate returns all the logs after a specific DATE  
 */
router.get('/course/:id', function(req, res, next) {
    //Query the DB and if no errors, return a specific log :id
    var params = url.parse(req.url, true).query;
    var query;

    if (params.after) {
        query = Log.find({course_uuid : req.params.id, logged_on: {$gte : params.after}});
    } else if (params.before) {
        query = Log.find({course_uuid : req.params.id, logged_on: {$lt : params.before}});
    } else {
        query = Log.find({course_uuid : req.params.id});
    }
    query.exec((err, logs) => {
        if(err) res.send(err);
        //If no errors, send the result back to the client
        res.json(logs);
    });
}); 

/*
 * DELETE /logs/:log_id route to delete a single log.
 */
router.delete('/:id', function(req, res, next) {
    Log.remove({uuid : req.params.id}, (err, result) => {
        res.status(204).send();
    });
});

module.exports = router;