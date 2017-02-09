var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var system = require('../controllers/models/systems');

/*
 * POST /systems to save a new system.
 */
router.post('/', function(req, res, next) {
    //var body = JSON.stringify(req.body);
    //var json =  JSON.parse('{ "message":"System successfully added!" }, {"body": ' + body + '}');
    //var newSystem = new System(req.body);
    //Save it into the DB.
    //newBook.save((err,book) => {
    //    if(err) {
    //        res.send(err);
    //    }
    //    else { //If no errors, send it back to the client
        console.log(req.body);
           res.status(201).json(req.body);
    //    }
    //});
    
    //res.send('saved a system');
});


/*
 * GET /systems route to retrieve all the systems.
 */
router.get('/', function(req, res, next) {
    res.send("return a system collection");
});

/*
 * GET /systems/:system_id route to retrieve a single system.
 */
router.get('/:id', function(req, res, next) {
    //Query the DB and if no errors, send all the systems
    //let query = System.find({});
    //query.exec((err, systems) => {
    //    if(err) res.send(err);
        //If no errors, send them back to the client
    //    res.json(systems);
    res.send("send a single system: " + req.params.id);
    });

/*
 * PUT /systems/:system_id route to update a single system.
 */
router.patch('/:id', function(req, res, next) {
    res.send("updated a single system: " + req.params.id);
});

/*
 * DELETE /systems/:system_id route to delete a single system.
 */
router.delete('/:id', function(req, res, next) {
    res.send("deleted a single system: " + req.params.id);
});


module.exports = router;