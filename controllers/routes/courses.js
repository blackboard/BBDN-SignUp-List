var express = require('express');
var router = express.Router();
var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Course = require('../models/courses');

/*
 * POST /courses to save a new course.
 */
router.post('/', function(req, res, next) {
    //res.send('post courses requested');
    var newCourse = new Course(req.body);

    //Save it into the DB.
    newCourse.save((err, course) => {
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
 * GET /courses route to retrieve all the courses.
 */
router.get('/', function(req, res, next) {
    var query = Course.find({});
    query.exec((err, courses) => {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(courses);
    });
});

/*
 * GET /courses/:uuid route to retrieve a single course.
 */
router.get('/:id', function(req, res, next) {
    //Query the DB and if no errors, return all the systems
    Course.findOne({uuid: req.params.id}, (err, course) => {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(course);
    });
});

router.get('/:id', function(req, res, next) {
    res.send('get courses requested');
});

/*
 * PUT /systems/:system_id route to update a single system.
 */
router.put('/:id', function(req, res, next) {
    Course.findOne({uuid: req.params.id}, (err, course) => {
        if(err) res.send(err);
        Object.assign(course, req.body).save((err, course) => {
            if(err) res.send(err);
            res.json(course);
        }); 
    });
});


/*
 * DELETE /courses/:id route to delete a single course.
 */
router.delete('/:id', function(req, res, next) {
    Course.remove({uuid : req.params.id}, (err, result) => {
        res.status(204).send();
    });
});

module.exports = router;