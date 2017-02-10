var express = require('express');
var router = express.Router();
//var mongoose = require('mongoose');
var System = require('../controllers/models/systems');
var mongoose = require('bluebird').promisifyAll(require('mongoose'));

/*
 * POST /systems to save a new system.
 */
router.post('/', function(req, res, next) {
    //console.log("req.body.json: " + JSON.stringify(req.body, null, 4));
    var newSystem = new System(req.body);

    //Save it into the DB.
    newSystem.save((err, system) => {
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
 * GET /systems route to retrieve all the systems.
 */
router.get('/', function(req, res, next) {
    var query = System.find({});
    query.exec((err, systems) => {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(systems);
    });
});

/*
 * GET /systems/:system_id route to retrieve a single system.
 */
router.get('/:id', function(req, res, next) {
    //Query the DB and if no errors, return all the systems
    System.findOne({system_id: req.params.id}, (err, system) => {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(system);
    });
});

/*
 * PUT /systems/:system_id route to update a single system.
 */
router.put('/:id', function(req, res, next) {
    System.findOne({system_id: req.params.id}, (err, system) => {
        if(err) res.send(err);
        Object.assign(system, req.body).save((err, system) => {
            if(err) res.send(err);
            res.json(system);
        }); 
    });
});

/*
 * DELETE /systems/:system_id route to delete a single system.
 */
router.delete('/:id', function(req, res, next) {
    System.remove({system_id : req.params.id}, (err, result) => {
        res.status(204).send();
    });
});


module.exports = router;