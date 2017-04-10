var express = require('express')
var router = express.Router()
// var mongoose = require('bluebird').promisifyAll(require('mongoose'))
var List = require('../models/lists')
var config = require('../../config/config')

var debug = (config.debug_mode === 'true')

/*
 * LIST SCHEMA ENDPOINTS
 * ....FULL LIST ENDPOINTS....
 * √ POST /lists - Create a new list
 * √ GET  /lists - retrieve all lists
 * √ PUT  /lists - Update all lists
 * DELETE   /lists - Delete all lists
 *
 * ....SPECIFIC LIST ENDPOINTS....
 * POST /lists/:id - Create a specific list
 * GET  /lists/:id - retrieve a specific list
 * PUT  /lists/:id - Update a specific list
 * DELETE   /lists/:id - Delete a specific list
 *
 * ....GROUPS ENDPOINTS....
 * POST /lists/:id/groups - Create a list group
 * GET  /lists/:id/groups - Retrieve a list group
 * PUT  /lists/:id/groups - Update a list group
 * DELETE   /lists/:id/groups - Delete a list group
 *
 * ....SPECIFIC GROUP ENDPOINTS....
 * POST /lists/:id/groups/:grp_id - Create a specific list group
 * GET  /lists/:id/groups/:grp_id - Retrieve a specific list group
 * PUT  /lists/:id/groups/:grp_id - Update a specific list group
 * DELETE   /lists/:id/groups/:grp_id - Delete a specific list group
 *
 * ....USER LIST ENDPOINTS....
 * POST /lists/:id/groups - Create a new group user_list
 * POST /lists/:id/groups/:grp_id/user_list - Create a
 * GET  /lists/:id/groups/:grp_id/users - retreive a group user list
 * PUT  /lists/:id/groups/:grp_id - update a specific list group
 * PUT  /lists/:id/groups/:grp_id/users - update a specific list group's users
 */



/*
 * POST /lists to save a new list.
 */
router.post('/', function (req, res, next) {
  var newList = new List(req.body)
  // Save it into the DB.
  newList.save((err, list) => {
    if (err) {
      if (err.code === '11000') {
        res.status(409).send(err)
      } else if (err.name === 'ValidationError') {
        res.status(400).send(err)
      } else {
        res.send(err)
      }
    } else { // If no errors, send it back to the client
      console.log(JSON.stringify(list))
      res.status(201).json(list)
    }
  })
})

/*
 * GET /lists route to retrieve all the lists.
 */
router.get('/', function (req, res, next) {
  var query = List.find({})
  query.exec((err, lists) => {
    if (err) res.send(err)
    res.json(lists)
  })
})

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

/*
 * PUT /lists/:id route to update a single list.
 */
router.put('/:id', function(req, res, next) {
    List.findOneAndUpdate({"uuid": req.params.id}, req.body, { "new": true}, function(err, list){
        if(err) res.send(err);
        res.status(200).json(list);
    });
});

/*
 * DELETE   /lists - Delete all lists
 */
router.delete('/', function(req, res, next) {
    List.remove({}, (err, result) => {
        if (debug) console.log("\n[lists.js] DELETE LISTS")
        res.status(204).send()
    })
})


// DELETE /lists/:id route to delete a single list.
router.delete('/:id', function (req, res, next) {
  List.findOneAndRemove({"uuid" : req.params.id}, (err, result) => {
    res.status(204).send()
  })
})

module.exports = router
