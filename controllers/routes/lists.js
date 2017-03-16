var express = require('express');
var router = express.Router();
var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var List = require('../models/lists');
var config = require('../../config/config');

var debug = (config.debug_mode=="true"?true:false);

/*
 * POST /lists to save a new list.
 */
router.post('/', function(req, res, next) {
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
           console.log(JSON.stringify(list));
           res.status(201).json(list);
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
    List.findOne({"uuid": req.params.id}, (err, list) => {
        if(err) res.send(err);
        //If no errors, send them back to the client
        res.json(list);
    });
});

router.get('/:id', function(req, res, next) {
    res.send('get lists requested');
});

/*
 * PUT /lists/:id route to update a single list.
 */
router.put('/:id', function(req, res, next) {
    List.findOneAndUpdate({"uuid": req.params.id}, req.body, { "new": true}, function(err, list){
        if (debug) console.log("\n[lists.js] PUT LIST: \n", req.body );
        if(err) res.send(err);
        res.status(200).json(list);
    });
});


/*
 * PATCH /lists/:id/userList route to update the whole userList on identified list.
 * Note: using this endpoint requires you to set created_on and updated_on on your user data
 * Need to rewrite to break apart the passed json and individually $push/.save to get dates auto added
 */
router.patch('/:id/userList', function(req, res, next) {
    List.findOneAndUpdate({"uuid": req.params.id}, {$set: {"userList" : req.body}}, {"new": true}, function(err, list) {
        if (debug) console.log("\n\n[lists.js] PATCH userList: \n", req.body );
        if(err) res.send(err);
        res.status(200).json(list);
    });
});


/*
 * PUT /lists/:id/userList/:userId route to add a user to the userList on identified list.
 */
router.put('/:id/userList/:userId', function(req, res, next) {
    List.findOneAndUpdate({"uuid": req.params.id}, {$push: {"userList" : req.body}}, {"new": true}, function(err, list) {
 
        if (debug) console.log("\n\n[lists.js] PUT user: \n", req.body );
        if(err) res.send(err);
        res.status(200).json(list);
    });
});

/* 
 * PATCH /lists/:uuid/userList/:userId updates a specific user in a specific list 
 * Note: using this endpoint requires you to set created_on and updated_on on your user data
 */
router.patch('/:id/userList/:userId', function(req, res, next) {
    var userId = req.params.userId;
    var users;
    var place;
    if (debug) console.log("\n\n[lists.js] PATCH user: id \n", req.params.id);
    if (debug) console.log("\n\n[lists.js] PATCH user: userId \n", userId);
    List.findOne({"uuid": req.params.id}, function(err, list) {
        if (debug) console.log("\n\n[lists.js] PATCH user in: \n", req.body );
        if (debug) console.log("\n\n[lists.js] PATCH user: found list \n", list);
        //find our user
        users =  list.userList;
        for(var i=0;i<users.length;i++){
            if (users[i]["user_uuid"] == userId) place = i;
            if (debug) console.log("\n\n[lists.js] PATCH user: user to Update \n", users[i]);
        }
        users[place].user_uuid = req.body.user_uuid || users[place].user_uuid;
        users[place].role = req.body.role || users[place].role;
        users[place].added_by = req.body.added_by || users[place].added_by;
        users[place].waitlisted = req.body.waitlisted || users[place].waitlisted;
        users[place].created_on = req.body.created_on || users[place].created_on;
        users[place].updated_on = req.body.updated_on || new Date();

        if (debug) console.log("\n\n[lists.js] PATCH user: Updated user record \n", users[place]);
        if (debug) console.log("\n\n[lists.js] PATCH user: usersList \n", users);
        if (debug) console.log("\n\n[lists.js] PATCH user: list \n", list);
		// Save the updated document back to the database
        list.save(function (err, list) {
            if (err) {
                res.status(500).send(err)
            }
            res.status(200).json(list);
        });
    });
});

/* DELETE /lists/:id/userList/:userId deletes a specific user in a specific list */
router.delete('/:id/userList/:userId', function(req, res, next) {
    var userId = req.params.userId;
	var id = req.params.id;
    var users;
    var place;
    if (debug) console.log("\n\n[lists.js] DELETE user: list id \n", id);
    if (debug) console.log("[lists.js] DELETE user: userId \n", userId);
    List.findOneAndUpdate({"uuid": id}, 
		{ $pull: { "userList": {"user_uuid": userId} } }, {"new": true}, (err, list) => {
              if (debug) console.log("\n\n[lists.js] DELETE user: post delete list \n", list);
              if (err) {
                res.status(500).send(err)
              }
            res.status(200).json(list);
    });
});
 
 /* DELETE /lists/:id/userList route to delete the whole userList on identified list.*/
router.delete('/:id/userList', function(req, res, next) {
    if (debug) console.log("\n\n[lists.js] DELETE userList: id \n", req.params.id);
    List.findOneAndUpdate({"uuid": req.params.id}, 
		{ $set: { "userList": [] }}, {"new": true}, (err, list) => {
              if (debug) console.log("\n\n[lists.js] DELETE user: post delete list \n", list);
              if (err) {
                res.status(500).send(err)
              }
            res.status(200).json(list);
    });
});

/*
 * DELETE /lists/:id route to delete a single list.
 */
router.delete('/:id', function(req, res, next) {
    List.findOneAndRemove({"uuid" : req.params.id}, (err, result) => {
        res.status(204).send();
    });
});

module.exports = router;
