var express = require('express');
var router = express.Router();
var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Course = require('../controllers/models/courses');

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

router.get('/', function(req, res, next) {
    res.send('get all courses');
});

router.get('/:id', function(req, res, next) {
    res.send('get courses requested');
});

router.put('/:id', function(req, res, next) {
    res.send('update course requested');
});

router.delete('/:id', function(req, res, next) {
    res.send('delete course requested');
});

module.exports = router;