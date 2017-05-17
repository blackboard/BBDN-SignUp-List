var express = require('express')
var router = express.Router()
var System = require('../models/systems')
var system = {}

var config = require('../../config/config')
var debug = (config.debugMode === 'true')


/*
 * Add systemJSON to save a new system.
 */
system.addSystem = function (systemJSON, next) {
  if (debug) console.log('[SYSTEM.JS] Incomming systemJSON:\n', systemJSON)
  var resJSON = {}
  var newSystem = new System(systemJSON)
  // if (debug) console.log('[SYSTEM.JS] newSystem:\n', newSystem)
  // Save it into the DB.
  newSystem.save(function (err, sys) {
    if (err) {
      // if (debug) console.log('[SYSTEM.JS] save err', err)
      if (err.code === '11000') {
        // if (debug) console.log('[SYSTEM.JS] SAVE err.code', err.code)
        resJSON = {'err': 409}
        next(err, {'err': 409})
        // if (debug) console.log('[SYSTEM.JS] SAVE 11000 resJSON: ', resJSON)
      } else if (err.name === 'ValidationError') {
        // if (debug) console.log('[SYSTEM.JS] SAVE err.name: ', err.name)
        resJSON = {'err': 400}
        next(err, {'err': 400})
        // if (debug) console.log('[SYSTEM.JS] SAVE ValidationError resJSON: ', resJSON)
      } else {
        resJSON = {'err': 418}
        next(err, {'err': 418})
        // if (debug) console.log('[SYSTEM.JS] SAVE teapot?: ', resJSON)
      }
    } else { // If no errors, send it back to the client
      // if (debug) console.log('[SYSTEM.JS] SAVE system:\n', system)
      resJSON = sys
      next(err, sys)
      // if (debug) console.log('[SYSTEM.JS] SAVE system\n', resJSON)
    }
    if (debug) console.log('[SYSTEM.JS] addSystem resJSON:\n', resJSON)
    return resJSON
  })
}

/*
 * Retrieve all systems.
 */
system.getSystems = function (next) {
  if (debug) console.log('[SYSTEM.JS] GET systems collection...')

  var query = System.find({})
  query.exec(function (err, systems) {
    if (debug) console.log('[SYSTEM.JS] GET systems collection:\n', systems)
    if (!err) {
      if (debug) console.log('\n[SYSTEMS.JS:getSystems]: :', systems)
      next(err, systems)    
    } else {
      console.log('ERROR: ', err)
      next(err, { 'err': 400 })
    }
  })
}

/*
 * Retrieve system based on system_id route to retrieve a single system.
 */
system.getSystem = function (systemId, next) {
  // Query the DB and if no errors, return all the systems
  console.log('\n[SYSTEMS.JS:getSystem]: :', systemId)
  System.findOne({'system_id': systemId}, function (err, sys) {
    if (!err) {
      console.log('\n[SYSTEMS.JS:getSystem]: :', sys)
      next(err, sys)
      // return system
    } else {
      console.log('ERROR: ', err)
      next(err, { 'err': 400 })
    }
  })
}


/*
 * Update system based on system_id route to update a single system.
 */
system.updateSystem = function (systemId, systemJSON, next) {
  System.findOne({'system_id': systemId}, (err, system) => {
    if (!err) {
      Object.assign(system, systemJSON).save((err, savedsystem) => {
        if (!err) {
          console.log('\n[SYSTEMS.JS:updateSystem]: :', savedsystem)
          next(err, savedsystem)
        } else {
          console.log('ERROR: ', err)
          next(err, { 'err': 400 })  
        }
      })
    }
  })
}

/*
 * deleteSystem(systemId) to delete a single system.
 */
system.deleteSystem = function (systemId, next) {
  System.remove({'system_id': systemId}, (err, result) => {
    if (!err) {
      console.log('\n[SYSTEMS.JS:deleteSystem]:result status :', result.result)
      next(err, true)
    } else {
      console.log('\n[SYSTEMS.JS:deleteSystem] error:', err)
      next(err, false)
    }
  })
}

module.exports = system
