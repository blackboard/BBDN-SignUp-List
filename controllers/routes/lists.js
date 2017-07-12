// @ts-check

var express = require('express')
var router = express.Router()
var List = require('../models/lists')
var config = require('../../config/config')
var debug = true//(config.debugMode === 'true')
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
    res.status(403).send()
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
    res.status(403).send()
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
      if (debug) console.log('[lists.js route] PUT: INCOMING: ' + JSON.stringify(req.body))

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
 * INPROGRESS
 * PUT /lists/:id/groups/:grpId - fully update a specific list group
 * * Only accessible by AP roles
 */
router.put('/:id/groups/:grpId', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  if (jwtToken.jwtValidRole(token, validRoles)) {
    if (debug) console.log('\n[Lists/:id/groups]: PUT /lists/' + req.params.id + '/groups/' + req.params.grpId + ' called\n')
    if (debug) console.log('\n[Lists/:id/groups]: req.body' + JSON.stringify(req.body, null, 2) + ' \n')
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find existing group and replace with incoming
      for (var i = 0, length = list.list_groups.length; i < length; i++) {
        console.log("i: " + i + " length: " + length + " grp_uuid: " + list.list_groups[i].grp_uuid + " grpId: " +  req.params.grpId);
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          list.list_groups[i] = req.body
          break
        }

      }
      if (debug) console.log('\n[Lists/:id/groups]: List after updating specific groupList : \n' + JSON.stringify(list, null, 2))
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
 * POST /lists/:id/groups/:grpId/members creates set of memberships in a list group
 * * Accessible by AP role
 * * Overwrites existing group memberships
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
          list.list_groups[i].grp_members = req.body
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
 * PUT /lists/:id/groups/:grpId/members creates user in a list group
 * * Accessible by AP and SP roles
 * * Requires SP user_uuid and membership user_uuid match
 */
router.put('/:id/groups/:grpId/members', function (req, res, next) {
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  var requestorsUserUUID = jwtToken.jwtGetUserUUID(token)
  var reqUUID = req.body.user_uuid
  var grpFound = false
  var requestorRole = jwtToken.jwtGetRole(token)

  if (debug) console.log('MEMBERUUID: [' + reqUUID + ']')
  if (debug) console.log('REQUESTORTOKENUUID: [' + requestorsUserUUID + ']')
  if (debug) console.log('REQUESTORSUSERROLE: [' + requestorRole + ']')
  if ((jwtToken.jwtValidRole(token, validRoles)) && ((requestorsUserUUID === reqUUID) || (requestorRole === 'AP'))) {
    // if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      for (var i = 0, length = list.list_groups.length; i < length; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          grpFound = true
          list.list_groups[i].grp_members.push(req.body)
        }
        if (grpFound) break
      }
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
 * * * SP can only retrieve if list.student_view === true
 */
router.get('/:id/groups/:grpId/members', function (req, res, next) {
  var validRoles = ['AP']
  var token = req.cookies['sulToken']
  var membershipsFound = false
  if (debug) console.log('GET MEMBER LIST: [' + req.params.id + ']')
  if (debug) console.log('GET MEMBER GROUP: [' + req.params.grpId + ']')
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find group and return grp_members
      if (debug) console.log('LIST STUDENT_VIEW: ', list.student_view)
      if (jwtToken.jwtGetRole(token) === 'AP' || list.student_view === true) {
        if (debug) console.log('SEARCHING FOR GROUP')
        for (var i = 0, length = list.list_groups.length; i < length; i++) {
          if (list.list_groups[i].grp_uuid === req.params.grpId) {
            if (debug) console.log('FOUND GROUP:' + list.list_groups[i].grp_uuid)
            if (debug) console.log('FOUND MEMBERS:\n', list.list_groups[i].grp_members)
            membershipsFound = true
            res.status(200).json(list.list_groups[i].grp_members)
          }
        }
        if (!membershipsFound) {
          res.status(404)
        }
      }
    })
  } else {
    console.log('INSUFFICIENT PRIVILEGES for GET /lists/:id/groups/:grpId/members')
    res.status(403).send()
  }
})

/*
 * GET /lists/:id/groups/:grpId/members/:userId gets a specific User in a list group
 * * Accessible by AP and SP roles
 */
router.get('/:id/groups/:grpId/members/:userId', function (req, res, next) {
  if (debug) console.log('GET MEMBER LIST: [' + req.params.id + ']')
  if (debug) console.log('GET MEMBER GROUP: [' + req.params.grpId + ']')
  if (debug) console.log('GET MEMBER USER: [' + req.params.userId + ']')
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  var role = jwtToken.jwtGetRole(token)
  var tokenUser = jwtToken.jwtGetUserUUID(token)
  if (debug) console.log('GET MEMBER USER: REQUESTOR [' + tokenUser + ']')

  var usrFound = false
  var grpFound = false
  var foundUser
  if (jwtToken.jwtValidRole(token, validRoles)) {
    List.findOne({'list_uuid': req.params.id}, function (err, list) {
      if (err) res.send(err)
      // find group and return user from the groups grp_members
      for (var i = 0, len = list.list_groups.length; i < len; i++) {
        if (list.list_groups[i].grp_uuid === req.params.grpId) {
          // this is our group
          var grpPos = i
          grpFound = true
          if (debug) console.log('GET USER FROM GROUP: FOUND GROUP AT: ', grpPos)
          if (debug) console.log('GET USER FROM GROUP: FOUND GROUP MEMBERS: \n', list.list_groups[grpPos].grp_members)
          for (var n = 0, length = list.list_groups[grpPos].grp_members.length; n < length; n++) {
            if (debug) console.log('GET USER FROM GROUP: FOUND GROUP MEMBER: \n', list.list_groups[grpPos].grp_members[n])
            if (list.list_groups[grpPos].grp_members[n].user_uuid === req.params.userId) {
              // this is our user
              if (debug) console.log('GET USER FROM GROUP: MEMBER FOUND AT: ', n)
              usrFound = true
              if (list.list_groups.grp_uuid[grpPos].grp_members[n].user_uuid === tokenUser) {
                foundUser = list.list_groups[grpPos].grp_members[n]
                res.status(200).json(foundUser)
              }
              console.log('GET USER FROM GROUP: MEMBER FOUND: ', list.list_groups[grpPos].grp_members[n])
            }
          //  if (usrFound) break
          }
        }
       // if (grpFound) break
      }
      if (!grpFound) {
        console.log('GET MEMBERSHIP: GROUP ' + req.params.grpId + ' NOT FOUND')
        res.status(404)
      }
      if (!usrFound) {
        console.log('GET MEMBERSHIP: USR ' + req.params.userId + ' NOT FOUND IN GROUP ' + req.params.grpId)
        res.status(404)
      }
    })
  } else {
    res.status(403)
  }
})

/*
 * PUT (update) a specific user in a list group
 * * Accessible by AP and SP roles
 */
router.put('/:id/groups/:grpId/members/:userId', function (req, res, next) {
  if (debug) console.log('UPDATE LIST: ', req.params.id)
  if (debug) console.log('UPDATE GROUP: ', req.params.grpId)
  if (debug) console.log('UPDATE USER: ', req.params.userId)
  if (debug) console.log('UPDATE BODY: ', req.body)
  var validRoles = ['AP', 'SP']
  var grpFound = false
  var usrFound = false
  var foundGrpPos
  var token = req.cookies['sulToken']
  var requestorsUserUUID = jwtToken.jwtGetUserUUID(token)
  if (debug) console.log('UPDATE ROLE:' + jwtToken.jwtGetRole(token) +  '\n requestorsUserUUID = params.userId?: ', requestorsUserUUID === req.params.userId)
  if (jwtToken.jwtValidRole(token, validRoles)) {
    if (jwtToken.jwtGetRole(token) === 'AP' || req.params.userId === requestorsUserUUID) {
      List.findOne({'list_uuid': req.params.id}, function (err, list) {
        if (err) res.send(err)
        // find group and return user from the groups grp_members
        for (var i = 0, len = list.list_groups.length; i < len; i++) {
          if (list.list_groups[i].grp_uuid === req.params.grpId) {
            grpFound = true
            foundGrpPos = i
          }
          if (grpFound) break
        }
        if (!grpFound) {
          if (debug) console.log('******** UPDATE grp_uid ' + req.params.grpId + ' not found *******')
          res.status(404).send({'err': 'grp_uid ' + req.params.grpId + ' not found'})
        }
        if (debug) console.log('GROUP FOUND... SEARCHING FOR USER in Group: ', foundGrpPos)
        if (debug) console.log('LENGTH FOUND GROUP MEMBERS: ', list.list_groups[foundGrpPos].grp_members.length)
        for (var n = 0, length = list.list_groups[foundGrpPos].grp_members.length; n < length; n++) {
          if (debug) console.log(i + ') USER FROM LIST:', list.list_groups[foundGrpPos].grp_members[n].user_uuid + '\nSearching for User: ' + req.params.userId)
          if (debug) console.log('DOES THE USER ID MATCH?: ', list.list_groups[foundGrpPos].grp_members[n].user_uuid === req.params.userId)
          if (list.list_groups[foundGrpPos].grp_members[n].user_uuid === req.params.userId) {
            usrFound = true
            // if (debug) console.log('BEFORE UPDATING USER DATA: \n', list.list_groups[foundGrpPos])
            list.list_groups[foundGrpPos].grp_members[n] = req.body
            if (debug) console.log('AFTER UPDATING USER DATA: \n', list.list_groups[foundGrpPos])
            break
          }
        }
        if (!usrFound) {
          if (debug) console.log('******** UPDATE user_uuid ' + req.params.userId + ' not found *******')
          res.status(404).send({'err': 'user_uid ' + req.params.userId + ' not found'})
        }
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
  } else {
    res.status(403).send()
  }
})

/*
 * DELETE /lists/:id/groups/:grpId/members/:userId deletes a specific user from a list group
 * * Accessible by AP and SP roles
 * * SP sub must match target or a 403 will be issued
 */
router.delete('/:id/groups/:grpId/members/:userId', function (req, res, next) {
  if (debug) console.log('LIST: ', req.params.id)
  if (debug) console.log('GROUP: ', req.params.grpId)
  if (debug) console.log('USER: ', req.params.userId)
  var grpFound = false
  var usrFound = false
  var foundGrpPos
  var validRoles = ['AP', 'SP']
  var token = req.cookies['sulToken']
  var requestorsUserUUID = jwtToken.jwtGetUserUUID(token)
  if (debug) console.log('requestorsUserUUID = paramsuserId?: ', requestorsUserUUID === req.params.userId)
  if (jwtToken.jwtValidRole(token, validRoles)) {
    if (jwtToken.jwtGetRole(token) === 'AP' || req.params.userId === requestorsUserUUID) {

      List.findOneAndUpdate({'list_uuid': req.params.id, 'list_groups.grp_uuid' : req.params.grpId}, { $pull: {'list_groups.$.grp_members' : { 'user_uuid' : req.params.userId } } }, function (err, list) {
        if (err) res.status(404).send(err)
        // find group and return user from the groups grp_members
        /*for (var i = 0, len = list.list_groups.length; i < len; i++) {
          if (debug) console.log(i + ') GROUP FROM LIST:', list.list_groups[i].grp_uuid + '\nSearching for Group: ' + req.params.grpId)
          if (debug) console.log('DOES THE GROUP ID MATCH?: ', list.list_groups[i].grp_uuid === req.params.grpId)
          if (list.list_groups[i].grp_uuid === req.params.grpId) {
            foundGrpPos = i
            grpFound = true
          }
          if (grpFound) break
        }
        if (!grpFound) {
          if (debug) console.log('******** grp_uid ' + req.params.grpId + ' not found *******')
          res.status(404).send()
        }
        if (debug) console.log('GROUP FOUND... SEARCHING FOR USER in Group: ', foundGrpPos)
        if (debug) console.log('LENGTH FOUND GROUP MEMBERS: ', list.list_groups[foundGrpPos].grp_members.length)
        for (var n = 0, length = list.list_groups[foundGrpPos].grp_members.length; n < length; n++) {
              if (debug) console.log(i + ') USER FROM LIST:', list.list_groups[foundGrpPos].grp_members + '\nSearching for User: ' + req.params.userId)
              if (debug) console.log('DOES THE USER ID MATCH?: ', list.list_groups[foundGrpPos].grp_members[n].user_uuid === req.params.userId)

              if (list.list_groups[foundGrpPos].grp_members[n].user_uuid === req.params.userId) {
                usrFound = true
                if (debug) console.log('BEFORE DELETING USER: \n', list.list_groups[foundGrpPos])
                delete list.list_groups[foundGrpPos].grp_members[n]
                if (debug) console.log('AFTER DELETING USER: \n', list.list_groups[foundGrpPos])
                break
              }
            }
        if (!usrFound) {
          if (debug) console.log('******** user_uuid ' + req.params.userId + ' not found *******')
          res.status(404).send()
        }
        list.save((err, list) => {
          if (err) {
            // do something
            res.status(400).send()
          } */
          res.status(200).json(list)
        })
      //})
    } else {
      res.status(403).send()
    }
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
    List.findOneAndUpdate({'list_uuid': req.params.id}, { $pull: {'list_groups' : { 'grp_uuid' : req.params.grpId } } }, function (err, list) {

      if (err) {
        console.log("[DELGROUP] err: " + JSON.stringify(err,null,2));
        res.status(400).send()
      } else {
        console.log("[DELGROUP] list: " + JSON.stringify(list,null,2));
        res.status(204).json(list)
      }
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
    res.status(403)
  }
})

module.exports = router
