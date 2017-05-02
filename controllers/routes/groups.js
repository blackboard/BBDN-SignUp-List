var express = require('express')
var router = express.Router()
var List = require('../models/groups')
var config = require('../../config/config')

var debug = (config.debugMode === 'true')

/* ....GROUPS ENDPOINTS....
 *
 * POST /lists/:id/groups - Create a list group
 * GET  /lists/:id/groups - Retrieve a list's groups
 * PUT  /lists/:id/groups - Update a list's groups
 * DELETE   /lists/:id/groups - Delete a list's groups
 *
 * ....SPECIFIC GROUP ENDPOINTS....
 * POST /lists/:id/groups/:grp_id - Create a specific list group
 * GET  /lists/:id/groups/:grp_id - Retrieve a specific list group
 * PUT  /lists/:id/groups/:grp_id - Update a specific list group
 * DELETE   /lists/:id/groups/:grp_id - Delete a specific list group
 *
 * ....USER LIST ENDPOINTS....
 * POST /lists/:id/groups/:grp_id/users - Create a new user_list on a group
 * GET  /lists/:id/groups/:grp_id/users - retreive a group user list
 * POST /lists/:id/groups/:grp_id/users/userUuid - add a user to a list's group
 * GET  /lists/:id/groups/:grp_id/users/userUuid - retrieve a user record from a group
 * PUT  /lists/:id/groups/:grp_id - update a specific list's group in whole
 * PUT  /lists/:id/groups/:grp_id/users - update a specific list and group's users
 * PUT  /lists/:id/groups/:grp_id/users/:userUuid - update a specific list group's users
 * DELETE /lists/:id/groups/:grp_id/users
 * DELETE /lists/:id/groups/:grp_id/users
 * DELETE /lists/:id/groups/:grp_id/users
 * 
 * 
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
 * GET  /lists/:id/groups - Retrieve a list's groups
 */
/*
 * PUT  /lists/:id/groups - Update a list's groups
 */
/*
 * DELETE   /lists/:id/groups - Delete a list's groups
 */
 