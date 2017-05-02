"use strict";
var db = require('../config/db');
var chai = require('chai');
var should = chai.should();
//chai.use(require('chai-as-promised'));
var expect = chai.expect;

var config = require('../config/config');
var mongoose = require('mongoose');
// Use bluebird since mongoose has deprecated mPromise
mongoose.Promise = require("bluebird");


//test that mongodb is available
describe("[test_db] Is mongoDB available?", function() {
    it('can connect to server', function(done) {
      mongoose.connect(config.test_db, function () {
        // always use config settings for testing.
        //0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        //db.connection.readyState.should.be.eql(1);
        mongoose.connection.readyState.should.be.eql(1);
        done();
      //});
    });
  });
});