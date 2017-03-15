"use strict";
var List = require('../controllers/models/lists');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var config = require('../config/config');
var mongoose = require("mongoose");
const uuidV1 = require('uuid/v1');

chai.use(chaiHttp);

//Always use test DB for testing...
var db = config.test_db;
/* LISTS 
    {
        name: { type: String, required: true },
        description: String,
        location: String,
        start: { type: Date, required: true },
        end: Date,
        waitlist_allowed: { type: Boolean, default: false }
        max_size: Number,
        max_waitlist: Number,
        state: {
            type: String,
            enum: ['NEW', 'STATUS'],
            default: 'NEW'
        },
        group: String,
        userlist: [{
            user_uuid: String,
            role: { type: String,
                enum: ['INSTRUCTOR', 'TEACHING_ASSISTANT', 'STUDENT'],
                default: 'STUDENT'},
            added_by: String,
            waitlisted: { type: Boolean, default: false },
            created_on: Date,
            updated_on: Date }
        }]
*/

//test data
var posted_uuid;
var good_list = { uuid: "mochaListSchemaTestList", ultrafied: false };
var bad_test_no_uuid = {
        "name": "no start date",
        "description": "test post list with no start date",
        "start": new Date(),
        "max_size": 30,
        "max_waitlist": 3,
};

var bad_test_no_name = { 
        "uuid": uuidV1(),
        "description": "test post list with no name",
        "start": new Date(),
        "max_size": 30,
        "max_waitlist": 3, 
};

var bad_test_no_date = { 
        "uuid": uuidV1(),
        "name": "no start date",
        "description": "test post list with no start date",
        "max_size": 30,
        "max_waitlist": 3,
};

var minimum_good_list = { 
        "uuid": uuidV1(),
        "name": "This is the minimum Good List",
        "description": "test post list with minimum data",
        "start": new Date(),
        "max_size": 30,
        "max_waitlist": 3,
        "state":"OPEN",
        "group": uuidV1()
};

var good_list_one_user = { 
        "uuid": uuidV1(),
        "name": "This is the minimum Good List",
        "description": "test post list with minimum data, one user",
        "start": new Date(),
        "max_size": 30,
        "max_waitlist": 3,
        "state": "OPEN",
        "userList": [ { "user_uuid": "SUPERMAN",
            "role": "STUDENT",
            "added_by": "BATMAN",
            "waitlisted": false} ]
};

var addedUser = {
        "uuid":list_created_uuid,
        "name": "This is the minimum Good List",
        "description": "test post list with minimum data, one user",
        "start": new Date(),
        "max_size": 30,
        "max_waitlist": 3,
        "state": "OPEN",
        "userList": [ 
          { "user_uuid": "SUPERMAN",
            "role": "STUDENT",
            "added_by": "BATMAN",
            "waitlisted": false},
          { "user_uuid": "AQUAMAN",
            "role": "STUDENT",
            "added_by": "WONDER WOMAN",
            "waitlisted": true } ]
}

var usr2Add = { "user_uuid": "AQUAMAN", "role": "STUDENT", "added_by": "WONDER WOMAN", "waitlisted": true };


var list_created_uuid = "";
var update_list_name = { "name": "tsiLtseTamehcStsiLahcom" };
var updated_list_name = "tsiLtseTamehcStsiLahcom"

//POST tests
describe("[test_list_schema] Fail on incorrectly formatted POST?", function() {
    it('it should not POST a list without uuid field', (done) => {
      chai
        .request(server)
        .post('/lists')
        .send(bad_test_no_uuid)
        .end(function(err, res) {
          expect(res).to.have.err;
        });
      done();
    });

    it('it should not POST a list without Name field', (done) => {
      chai
        .request(server)
        .post('/lists')
        .send(bad_test_no_name)
        .end(function(err, res) {
          expect(res).to.have.err;
        });
      done();
    });
    
    it('it should not POST a list without start date field', (done) => {
      chai
        .request(server)
        .post('/lists')
        .send(bad_test_no_date)
        .end(function(err, res) {
          expect(res).to.have.err;
        });
        done();
    });
  });


describe("[test_list_schema] Pass on correctly formatted POST?", function() {
    it('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/lists')
      .send(minimum_good_list)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.description.should.eql("test post list with minimum data");
      list_created_uuid = res.body.uuid;
      done();
    });
  });
});

describe("[test_list_schema] Pass on correctly formatted POST (WITH USER)?", function() {
    it('should POST correctly', (done) => {
    chai
      .request(server)
      .post('/lists')
      .send(good_list_one_user)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.description.should.eql("test post list with minimum data, one user");
      list_created_uuid = res.body.uuid;
      done();
    });
  });
});

//PUT - add entire userList
describe("[test_list_schema] Pass on correctly replacing a full List?", function() {
    var usrs = [
      { "user_uuid": "SUPERMAN",
        "role": "STUDENT",
        "added_by": "BATMAN",
        "waitlisted": false},
      { "user_uuid": "AQUAMAN",
        "role": "STUDENT",
        "added_by": "WONDER WOMAN",
        "waitlisted": true } ];

    var list;``

    it('should PUT new list', (done) => {
      chai
        .request(server)
        .put('/lists/' + list_created_uuid)
        .send(addedUser)
        .end((err, res) => {
          res.should.have.status(200);
          list = res.body.userList;
          
          for(var i=0;i<list.length;i++){
            delete list[i]["_id"];
          }
          
          list[0].should.have.all.members(usrs[0]);
          list[1].should.have.all.members(usrs[1]);

        });
      done();  
      });
    });

//PATCH - change out the entire userList
describe("[test_list_schema] Pass on full userList Update", function() {
  var list;

 var newUserList = [
		{
			"added_by" : "THOR",
			"user_uuid" : "HULK",
			"waitlisted" : false,
			"role" : "STUDENT"
		},
		{
			"added_by" : "IRON MAN",
			"user_uuid" : "CPT AMERICA",
			"waitlisted" : true,
			"role" : "STUDENT"
		}
	];
  
  //console.log("[test_list_schema] Pass on full userList Update: list_created_uuid: ",list_created_uuid);

  it('should PUT new userList', (done) => {
    chai
        .request(server)
        .patch('/lists/' + list_created_uuid + '/userList')
        .send(newUserList)
        .end((err, res) => {
          res.should.have.status(200);
          //console.log("\nres.body.userList: :\n", res.body.userList);
          list =  res.body.userList;
          
          for(var i=0;i<list.length;i++){
            delete list[i]["_id"];
          }
          
          list[0].should.have.all.members(newUserList[0]);
          list[1].should.have.all.members(newUserList[1]);

        });
      done();  
      });

});

//PUT add a new user to the userList
describe("[test_list_schema] Pass on User Add", function() {
  var list;
  var place;

 var newUser =
		{
			"added_by" : "BLACK WIDOW",
			"user_uuid" : "HAWKEYE",
			"waitlisted" : false,
			"role" : "STUDENT"
		};
  
  console.log("[test_list_schema] Pass on user add: list_created_uuid: ", list_created_uuid);

  it('should PUT new userList', (done) => {
    chai
        .request(server)
        .put('/lists/' + list_created_uuid + '/userList/' + "HAWKEYE")
        .send(newUser)
        .end((err, res) => {
          res.should.have.status(200);
          //console.log("\n[test_list_schema Put New User] res.body.userList: :\n", res.body.userList);
          list =  res.body.userList;
          
          for(var i=0;i<list.length;i++){
            delete list[i]["_id"];
            if (list[i]["user_uuid"] == "HAWKEYE") place = i;
          }
          
          list[place].should.have.all.members(newUser);
        });
      done();  
      });

});

//PATCH a specific user in the userList
describe("[test_list_schema] Pass on User Update", function() {
  var list;
  var place;

 var updatedUser =
		{
			"added_by" : "BLACK WIDOW",
			"user_uuid" : "HAWKEYE",
			"waitlisted" : false,
			"role" : "INSTRUCTOR"
		};
  
  console.log("[test_list_schema] Pass on  user Update: list_created_uuid: ", list_created_uuid);

  it('should PUT updated user', (done) => {
    chai
        .request(server)
        .patch('/lists/' + list_created_uuid + '/userList/' + "HAWKEYE")
        .send(updatedUser)
        .end((err, res) => {
          res.should.have.status(200);
          //console.log("\n[test_list_schema PATCH User] res.body.userList: :\n", res.body.userList);
          list =  res.body.userList;
          
          for(var i=0;i<list.length;i++){
            delete list[i]["_id"];
            if (list[i]["user_uuid"] == "HAWKEYE") {
              delete list[i]["updated_on"];
              delete list[i]["created_on"];
              place = i;
            }
          }
          //console.log("\n[test_list_schema PATCH User] User to Update: :\n", updatedUser);
          //console.log("\n[test_list_schema PATCH User] Updated User: :\n", list[place]);
          
          list[place].should.have.all.members(updatedUser);

        });
      done();  
      });
});

//GET single item test
describe("[test_list_schema] Return what we just created", function() {
    it('should GET correctly', (done) => {
    chai
      .request(server)
      .get('/lists/' + list_created_uuid)
      .end((err, res) => {
        res.should.have.status(200);
    });
    done();
  });
});


//GET collection test
describe("[test_list_schema] Return the entire lists collection", function() {
    it('should return the full collection', (done) => {
    chai
      .request(server)
      .get('/lists')
      .end((err, res) => {
        res.should.have.status(200);
    });
    done();
  });
});


//PUT (update) test
describe("[test_list_schema] Pass on correctly formatted PUT?", function() {
    it('should PUT (update) item correctly', (done) => {
    chai
          .request(server)
          .put('/lists/' + list_created_uuid)
          .send(update_list_name)
          .end((err, res) => {
            //res.should.be.json;
            res.body.should.be.a('object');
            //res.body.should.have.property('UPDATED');
            res.body.should.have.property('name');
            res.body.name.should.eql(updated_list_name);
    });
    done();
  });
});

describe("[test_list_schema] DELETE User", function() {
  it('should delete the user from the requested List', (done) => {
    chai
      .request(server)
      .delete('/lists/' + list_created_uuid + "/userList/" + "HAWKEYE")
      .end((err, res) => {
        //console.log("\n[test_list_schema DELETE user] Results: :\n", res.body);
        res.should.not.have.err;
        res.should.have.status(200);
      });
      done();
  });
});

//DELETE /lists/:id/userList - removes userList List
describe("[test_list_schema] DELETE UserList", function() {
  it('should delete the userList for the requested List', (done) => {
    chai
      .request(server)
      .delete('/lists/' + list_created_uuid + "/userList")
      .end((err, res) => {
        //console.log("\n[test_list_schema DELETE userList] Results: :\n", res.body);
        res.should.not.have.err;
        res.should.have.status(200);
        res.body.userList.length.should.be.eql(0);
      });
      done();
  });
});

describe("[test_list_schema] Delete what we created", function() {
    it('should delete what we POSTed', (done) => {     
    chai
      .request(server)
      .delete('/lists/' + list_created_uuid)
      .end((err, res) => {
        res.should.have.status(204);
      done();
    });
  });
});

//empty DB after tests
after(function (done) {
  console.log('[test_list_schema] Dropping test list collection');
//    console.log(mongoose.connection.readyState);
    mongoose.connection.on('open', function(){
      mongoose.connection.db.dropCollection('lists');
      mongoose.connection.close();
    });
  done();
});

