"use strict";
var chai = require('chai');
var should = chai.should();
//chai.use(require('chai-as-promised'));
var expect = chai.expect;

var config = require('../config/config');

console.log(config.db);

var mongoose = require('mongoose');
var db;

//test that mongodb is available
describe("Is mongoDB available?", function() {
    it('can connect to server', function(done) {
      mongoose.connect("mongodb://localhost/test", function () {
        // always use config settings for testing.
        //0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        mongoose.connection.readyState.should.be.eql(1);
        done();
      });
    });
});





/*
var db = require('../models');
var services = require('../services')

describe("sample tests", function() {
  var user1, user2;
  var user1TestEvents = [];    

  before(function(done) {
    db.Users.addUser({name:"John"}).
    then(function(john) {
      user1 = john;
      return db.Users.addUser({name: "Mary"});
    }).
    then(function(mary) {
      user2 = mary;
      return db.Events.addEvent{user: user1._id, event: "logged in", time: new Date()});
    }).
    then(function(event) {
     user1TestEvents.push(event);
     done()
    });
  };

  it('gets a users events', function() {
    var events = services.getEventsForUser(user1._id);
    return expect(events).eventually.to.have.length(user1TestEvents.length);
  });
  */