var express = require('express');
var router = express.Router();
var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var List = require('../models/lists');

/*
 * POST /lists to save a new list.
 */
router.post('/', function(req, res, next) {
    //res.send('post lists requested');
    var newList = new List(req.body);

    //Save it into the DB.
    newList.save((err, list) => {
        if(err) {
            if (err.code == '11000') { res.status(409).send(err); }
            else if ( err.name == "ValidationError" ) {
                res.status(400).send(err); 
            }
            else { res.send(err); }
        }
        else { //If no errors, send it back to the client
           //console.log(req.body);
           //console.log(list.id);
           res.status(201).json(req.body);
        }
    });
});



/*
 * GET /lists route to retrieve all the lists.
 */
router.get('/', function(req, res, next) {
    var query = List.find({});
    query.exec((err, lists) => {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(lists);
    });
});

/*
 * GET /lists/:uuid route to retrieve a single list.
 */
router.get('/:id', function(req, res, next) {
    //Query the DB and if no errors, return all the systems
    List.findOne({uuid: req.params.id}, (err, list) => {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(list);
    });
});

router.get('/:id', function(req, res, next) {
    res.send('get lists requested');
});

/*
 * PUT /systems/:system_id route to update a single system.
 */
router.put('/:id', function(req, res, next) {
    List.findOne({uuid: req.params.id}, (err, list) => {
        if(err) res.send(err);
        Object.assign(list, req.body).save((err, list) => {
            if(err) res.send(err);
            res.json(list);
        }); 
    });
});


/*
 * DELETE /lists/:id route to delete a single list.
 */
router.delete('/:id', function(req, res, next) {
    List.remove({uuid : req.params.id}, (err, result) => {
        res.status(204).send();
    });
});

module.exports = router;