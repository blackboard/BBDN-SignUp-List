// @ts-check

var express = require('express')
var router = express.Router()
// var mongoose = require('bluebird').promisifyAll(require('mongoose'))
var List = require('../models/lists')
var config = require('../../config/config')
var debug = (config.debugMode === 'true')
var jwtToken = require('./jwtToken')

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
 * √ GET  /lists/:id - retrieve a specific list
 * PUT  /lists/:id - Update a specific list
 * DELETE   /lists/:id - Delete a specific list
 *
 * ....SPECIFIC LIST GROUPS ENDPOINTS
 * POST /lists/:id/groups/ - add a group to the SUL list
 *      --- use PUT /lists/:id/groups/:grpId to update a course roster
 *      --- use DELETE /lists/:id/groups/:grpId/members/:userUUID to remove a user from the roster
 * GET /lists/:id/groups - get a lists groups
 * PUT /lists/:id/groups/:grpId - update a whole group
 * PUT /lists/:id/groups/:grpId/user - add a single user to a roster for the SUL course
 * GET /courses/:id/roster/:user_uuid - gets a specific user from the roster
 * DELETE /courses/:id/roster - delete a whole roster
 * DELETE /courses/:id/roster/:user_uuid - delete a user from the roster
 * DELETE /courses/:id/lists - delete all lists
 *
 * Define: Admin Privileges (AP) are set on users with roles of:
 *   Instructor or Teaching Assistant - thise entitled to see and manage the list
 *   Students do not have AP access
 * Define: Student Privileges (SP) are set on users with the Student role
 *   Students may only:
 *     view lists, view Groups*, Create, Update and Delete only their own group memberships**
 *     * Viewing Groups may or may not display group memberhsips other than the Student's based
 *         on the privacy setting on lists "sudent_view: true||false
 */

/*
 * POST /lists to save a new list.
 * * Only accessible by AP roles
 */
router.post('/', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
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
        if (debug) console.log('\n[lists.js routes]: post:\n', JSON.stringify(list))
        res.status(201).json(list)
      }
    })
  } else {
    res.send.status(403)
  }
})

/*
 * GET /lists route to retrieve all the lists.
 * * Accessible by AP and SP roles
 */
router.get('/', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    var query = List.find({})
    query.exec((err, lists) => {
      if (err) res.send(err)
      if (debug) console.log('\n[lists.js routes]: get:\n', JSON.stringify(lists))
      if (debug) console.log('\n')
      res.status(200).json(lists)
    })
  } else {
    res.send.status(403)
  }
})

/*
 * GET /lists/:uuid route to retrieve a single list.
 * * Accessible by AP and SP roles
 */
router.get('/:id', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    // Query the DB and if no errors, return all the systems
    if (debug) console.log('\n[lists.js routes]: get: ' + req.params.id + '\n')
    List.findOne({'list_uuid': req.params.id}, (err, list) => {
      if (err) res.send(err)
      if (debug) console.log('\n[lists.js routes]: get: ' + req.params.id + ':\n', JSON.stringify(list))
      res.status(200).json(list)
    })
  } else {
    res.status(403).send()
  }
})

/*
 * PUT /lists/:list_uuid to fully update a complete list record (use PATCH for partial updates)
 * * Only accessible by AP roles
 */
router.put('/:id', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({list_uuid: req.params.id}, (err, list) => {
      if (debug) console.log('[lists.js route] PUT: list: ' + JSON.stringify(list))
      if (debug) console.log('[lists.js route] PUT: UUID: ' + req.params.id)
      if (err) res.send(err)
      Object.assign(list, req.body).save((err, list) => {
        if (err) res.send(err)
        res.status(200).json(list)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * PUT /lists/:id/groups - add a list group
 * * Only accessible by AP roles
 */
router.put('/:id/groups', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    if (debug) console.log('\n[Lists/:id/groups]: PUT /lists/' + req.params.id + ' called\n')
    if (debug) console.log('\n[Lists/:id/groups]: req.body' + req.body.toString() + ' \n')
    // create a group associated with a list
    // Use JWT cookie to authorize request
    // save the group
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // add the new group
      list.list_groups.push(req.body)
      if (debug) console.log('\n[Lists/:id/groups]: List after adding new groupList : \n' + JSON.stringify(list))
      list.save((err, list) => {
        if (err) res.send(err)
        res.status(200).json(list)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * PUT /lists/:id/groups/:grpId - update a specific list group
 * * Only accessible by AP roles
 */
router.put('/:id/groups/:grpId', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    if (debug) console.log('\n[Lists/:id/groups]: PUT /lists/' + req.params.id + '/groups/' + req.params.grpId + 'called\n')
    if (debug) console.log('\n[Lists/:id/groups]: req.body' + req.body.toString() + ' \n')
    // create a group associated with a list
    // Use JWT cookie to authorize request
    // save the group
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find existing group and replace with incoming
      for (var i = 0, length = list.list_groups.length; i < length; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          list.list_groups[i] = req.body
        }
      }
      if (debug) console.log('\n[Lists/:id/groups]: List after adding new groupList : \n' + JSON.stringify(list))
      list.save((err, list) => {
        if (err) res.send(err)
        res.status(200).json(list)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * PUT /lists/:id route to update a single list as a whole.
 * * Only accessible by AP roles
 */
router.put('/:id', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOneAndUpdate({'list_uuid': req.params.id}, req.body, {'new': true}, function (err, list) {
      if (err) res.send(err)
      res.status(200).json(list)
    })
  } else {
    res.status(403).send()
  }
})

/*
 * POST /lists/:id/groups/:grpId/members creates users in a list group
 * * Accessible by AP role
 */
router.post('/:id/groups/:grpId/members', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find existing group and replace with incoming
      for (var i = 0, length = list.list_groups.length; i < length; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          list.list_groups[i].grp_members.push(req.body)
          break
        }
      }
      if (debug) console.log('\n[Lists/:id/groups]: List after adding new groupList : \n' + JSON.stringify(list))
      list.save((err, list) => {
        if (err) res.send(err)
        res.status(200).json(list)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * POST /lists/:id/groups/:grpId/members/:mbrId creates users in a list group
 * * Accessible by AP and SP roles
 */
router.post('/:id/groups/:grpId/members', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find existing group and replace with incoming
      for (var i = 0, length = list.list_groups.length; i < length; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          list.list_groups[i].grp_members.push(req.body)
          break
        }
      }
      if (debug) console.log('\n[Lists/:id/groups]: List after adding new groupList : \n' + JSON.stringify(list))
      list.save((err, list) => {
        if (err) res.send(err)
        res.status(200).json(list)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * GET /lists/:id/groups/:grpId/members gets users in a list group
 * * Accessible by AP and SP roles
 */
router.get('/:id/groups/:grpId/members', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find group and return grp_members
      for (var i = 0, length = list.list_groups.length; i < length; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          res.status(200).json(list.list_groups[i].grp_members)
        } else {
          res.status(404).send()
        }
      }
    })
  } else {
    res.status(403).send()
  }
})

/*
 * GET /lists/:id/groups/:grpId/members/:userId gets a specific User in a list group
 * * Accessible by AP and SP roles
 */
router.get('/:id/groups/:grpId/members/:userId', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find group and return user from the groups grp_members
      for (var i = 0, len = list.list_groups.length; i < len; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          for (var n = 0, length = list.list_groups[i].grp_members; n < length; n++) {
            if (list.list_groups[i].grp_members[n].user_uuid === req.params.userId) {
              res.status(200).json(list.list_groups[i].grp_members[n])
            } else {
              res.status(404).send()
            }
          }
        } else {
          res.status(404).send()
        }
      }
    })
  } else {
    res.status(403).send()
  }
})

/*
 * PUT (update) a specific user in a list group
 * * Accessible by AP and SP roles
 */
router.put('/:id/groups/:grpId/members/:userId', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find group and return user from the groups grp_members
      for (var i = 0, len = list.list_groups.length; i < len; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          for (var n = 0, length = list.list_groups[i].grp_members; n < length; n++) {
            if (list.list_groups[i].grp_members[n].user_uuid === req.params.userId) {
              list.list_groups[i].grp_members[n] = req.body
              break
            }
          }
          break
        } else {
          res.status(404).send()
        }
      }
      // add SP user check if SP and SP.user === member.uuid go
      list.save((err, list) => {
        if (err) {
          // do something
          res.status(400).send()
        }
        res.status(200).json(list)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * DELETE a specific user from a list group
 * * Accessible by AP and SP roles
 */
router.delete('/:id/groups/:grpId/members/:userId', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find group and return user from the groups grp_members
      for (var i = 0, len = list.list_groups.length; i < len; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          for (var n = 0, length = list.list_groups[i].grp_members; n < length; n++) {
            if (list.list_groups[i].grp_members[n].user_uuid === req.params.userId) {
              delete list.list_groups[i].grp_members[n]
            } else {
              res.status(404).send()
            }
          }
        } else {
          res.status(404).send()
        }
      }
      // add SP user check if SP and SP.user === member.uuid go
      list.save((err, list) => {
        if (err) {
          // do something
          res.status(400).send()
        }
        res.status(200).json(list)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * DELETE /lists/:id/groups/:grpId deletes a list group in it's entirety
 * * Only accessible by AP roles
 */

router.delete('/:id/groups/:grpId', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find existing group and replace with incoming
      for (var i = 0, len = list.list_groups.length; i < len; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          delete list.list_groups[i]
        }
      }
      if (debug) console.log('\n[Lists/:id/groups]: List after adding new groupList : \n' + JSON.stringify(list))
      list.save((err, list) => {
        if (err) {
          // do something
          res.status(400).send()
        }
        res.status(200).json(list)
      })
    })
  } else {
    res.status(403).send()
  }
})

/*
 * DELETE /lists/:id - Delete a specific list
 * * Only accessible by AP roles
 */
router.delete('/:id', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOneAndRemove({'list_uuid': req.params.id}, (err, result) => {
      if (debug) console.log('\n[lists.js] DELETE LIST[' + req.params.id + ']')
      if (err) {
        // do something
        res.status(400).send()
      }
      res.status(204).send()
    })
  } else {
    res.status(403).send()
  }
})

/*
 * DELETE   /lists - Delete all lists
 * * Only accessible by AP roles
 */
router.delete('/', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.remove({}, (err, result) => {
      if (debug) console.log('\n[lists.js] DELETE LISTS[]')
      if (err) {
        // do something
        res.status(400).send()
      }
      res.status(204).send()
    })
  } else {
    res.status(403).send()
  }
})

/*
 * DELETE /lists/:id route to delete a single list.
 * * Only accessible by AP roles
 */
router.delete('/:id', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOneAndRemove({'list_uuid': req.params.id}, (err, result) => {
      if (err) {
        // do something
        res.status(400).send()
      }
      res.status(204).send()
    })
  } else {
    res.status(403).send()
  }
})

module.exports = router
