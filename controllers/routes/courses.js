var express = require('express');
var router = express.Router();
var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Course = require('../models/courses');

var config = require('../../config/config');
var debug = (config.debug_mode=="true"?true:false);

// √ POST /courses to create a new SUL course record
// √ PUT /courses/:id to update a complete course record (use PATCH for partial updates)
// √ GET /courses/:id to retrieve a single SUL course
// √ GET /courses to retrieve a collection of all SUL courses
// √ DELETE /courses/:id - delete existing SUL course
// √ PATCH /courses/:id - partial update of identified course
// √ POST /courses/:id/roster/ - add a roster to the SUL course 
//      --- use PUT /courses/:id/roster to update a course roster
//      --- use DELETE to remove a user from the roster
// √ PUT /courses/:id/roster - update a whole roster
// √ GET /courses/:id/roster - get a whole roster
// √ PATCH /courses/:id/roster - add a single user to a roster for the SUL course
// √ GET /courses/:id/roster/:user_uuid - gets a specific user from the roster
// √ DELETE /courses/:id/roster - delete a whole roster
// √ DELETE /courses/:id/roster/:user_uuid - delete a user from the roster
// √ DELETE /courses/:id/lists - delete all lists

//put on hold until we decide we need these
// POST /courses/:id/lists/ - add a whole list of lists
// POST /courses/:id/lists/:list_uuid - update a specific list
// DELETE /courses/:id/lists/: list_uuid - delete a list from the lists


/*
 * POST /courses to create a new SUL course record
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
        };
    });
});



/*
 * GET /courses to retrieve a collection of all SUL courses
 */
router.get('/', function(req, res, next) {
    var query = Course.find({});
    query.exec((err, courses) => {

        if(err) res.send(err);
        //If no errors, send them back to the client
        if(!courses) {
          if (debug) console.log("send 204");
          res.sendStatus(204);
        } else {
          if (debug) console.log("send courses");
          res.sendStatus(200).json(courses);
        }
    });
});

/*
 * GET /courses/:id to retrieve a single SUL course
 */
router.get('/:id', function(req, res, next) {
    //Query the DB and if no errors, return all the systems
    Course.findOne({uuid: req.params.id})
    .populate('lists')
    .exec(function (err, course) {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(course);
    });
});

/*
 * √ DELETE /courses/:id/lists - delete a whole list of lists
 */
router.delete('/:id/lists', function(req, res, next) {
    if (debug) console.log("\n\n[courses.js] DELETE lists from course:  \n", req.params.id);
    Course.findOneAndUpdate({"uuid": req.params.id}, { $set: { "list": [] }}, {"new": true}, (err, course) => {
              if (debug) console.log("\n\n[courses.js] DELETE (empty) list of Lists: post delete:\n", course);
              if (err) {
                res.status(500).send(err)
              }
            res.status(200).json(course);
    });
});


/*
 * √ GET /courses/:id/roster/:user_uuid - gets a specific user from the roster
 */
router.get('/:id/roster/:uuid', function(req, res, next) {

    var userId = req.params.uuid;
    var foundUser;

    if (debug) console.log("\n\n[courses.js] GET course roster user from: \n", req.params.id );
    if (debug) console.log("\n\n[courses.js] GET course roster user: \n" + userId);

    //Course.find({"uuid": req.params.id}, {"roster": {$elemMatch: { "user_uuid": userId } } }, function(err, course) {
    Course.findOne({"uuid": req.params.id}, function(err, course) {
        if(err) res.send(err);
        if (debug) console.log("\n\n[courses.js] Found course: \n" + course);
        var cRoster = course.roster;
        if (debug) console.log("\n\n[courses.js] Found course cRoster: \n" + cRoster);
        for(var i=0;i<cRoster.length;i++){
            if (cRoster[i]["user_uuid"] == userId) {
                if (debug) console.log("\n\n[courses.js] Found user: \n", cRoster[i]["user_uuid"]);
                if (debug) console.log("\n\n[courses.js] Found user: \n", cRoster[i]);

                foundUser = cRoster[i];//["user_uuid"];
            }
        }

        //if (debug) console.log("\n\n[courses.js] Found course roster user: \n" + course.roster.user_uuid);
   
        res.status(200).json(foundUser);
    });

});



/*
 * PUT /courses/:id to fully update a complete course record (use PATCH for partial updates)
 */
router.put('/:id', function(req, res, next) {
    Course.findOne({uuid: req.params.id}, (err, course) => {
        if (debug) console.log("[courses.js] PUT: course: " + JSON.stringify(course));
        if (debug) console.log("[courses.js] PUT: UUID: " + req.params.id);
        if(err) res.send(err);
        Object.assign(course, req.body).save((err, course) => {
            if(err) res.send(err);
            res.status(200).json(course);
        });
    });
});

/*
 * PATCH /courses/:id - partial update of identified course
*/
router.patch('/:id/', function(req, res, next) {
    var uuid = req.params.id;
    if (debug) console.log("\n\n[courses.js] PATCH course: id \n", req.params.id);
    Course.findOne({"uuid": req.params.id}, function(err, course) {
        if (debug) console.log("\n\n[courses.js] PATCH course in: \n", req.body );
        if (debug) console.log("\n\n[courses.js] PATCH course: found  \n", course);

        course.uuid =  req.body.uuid || course.uuid;
        course.externalId = req.body.externalId || course.externalId;
        course.roster = req.body.roster || course.roster;
        course.lists = req.body.lists || course.lists;
        course.ultrafied = req.body.ultrafied || course.ultrafied;
        course.created_on = req.body.created_on || course.created_on;
        course.updated_on = new Date();

        if (debug) console.log("\n\n[courses.js] PATCH course results: \n", course);
		// Save the updated document back to the database
        course.save(function (err, course) {
            if (err) {
                res.status(500).send(err)
            }
            res.status(200).json(course);
        });
    });
});

/*
 * PATCH /courses/:id/roster/ - add a user to a roster for the SUL course
 */
router.patch('/:id/roster', function(req, res, next) {
    var userToAdd = req.body;
    if (debug) console.log("\n\n[courses.js] PATCH user: userToAdd: \n", userToAdd );

    Course.findOneAndUpdate({"uuid": req.params.id}, {$addToSet: { "roster": userToAdd } }, {"new": true }, function(err, course) {
        if(err) res.send(err);
        if (debug) console.log("\n\n[courses.js] PATCH user: \n", res.body );
        res.status(200).json(course);

        });     
    });

/*
 * DELETE /courses/:id - delete existing SUL course
 */
router.delete('/:id', function(req, res, next) {
    Course.remove({uuid : req.params.id}, (err, result) => {
        res.status(204).send();
    });
});

module.exports = router;
