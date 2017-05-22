(function() {
    'use strict';

    angular
        .module('signupApp')
        .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope', '$log', '$q', '$filter', 'courseService', 'groupService', 'ltiService', 'listService', 'membershipService', 'rosterService', '$uibModal'];

    /* @ngInject */
    function SignupController($scope, $log, $q, $filter, courseService, groupService, ltiService, listService, membershipService, rosterService, $uibModal) {
      var vm = this;

      vm.access_token = "";
      vm.addList = addList;
      vm.addMe = addMe;
      vm.addUser = addUser;
      vm.calculateTaken = calculateTaken;
      vm.config = {};
      vm.config.add_list = false;
      vm.config.showInfo = false;
      vm.config.showMembers = false;
      vm.course = {};
      vm.createGroup = createGroup;
      vm.delMe = delMe;
      vm.delUser = delUser;
      vm.emailList = emailList;
      vm.exportList = exportList;
      vm.getData = getLtiData;
      vm.getUserById = getUserById;
      vm.list = {};
      vm.member = {};
      vm.member.userInfo = [];
      vm.pickUser = false;
      vm.print =  print;
      vm.reserveSpaces = reserveSpaces;
      vm.user = {};
      vm.userInList = userInList;

      activate();

      function activate() {
        vm.getData();
      }

      function getLtiData() {
        ltiService.getData()
          .then(function (response) {
              $log.log("Got Response Yo!");
              vm.config.lti = response.data;
              vm.config.lti.debug_mode = true;
              getCourse();
              getUser();
              loadRoster();
          }, function (error) {
              vm.status = 'Unable to load lti data: ' + error.message;
              $log.log(vm.status);
          });
      };

      function getCourse() {
        courseService.getCourseFromLearn(vm.config.lti.system_guid, vm.config.lti.course_uuid)
          .then(function (response) {
              $log.log("getCourse: response=" + JSON.stringify(response));
              $log.log("getCourse: response=" + JSON.stringify(response.data));
              $log.log("getCourse: response=" + JSON.stringify(response.data.name));
              var ultraStatus = response.data.ultraStatus;
              var ultrafied = ultraStatus === 'Ultra' || ultraStatus === 'UltraPreview' ? true : false;
              var courseName = response.data.name;
              $log.log("getCourse: varcheck={ courseName : " + courseName + ", ultraStatus : " + ultraStatus + " }");
              courseService.getCourse(vm.config.lti.course_uuid)
                .then(function (response) {
                    if(!response.data) {
                      createCourse(ultrafied,courseName);
                    } else {
                      vm.course = response.data;
                      vm.course['name'] = courseName;
                    }
                  }, function (error) {
                      vm.status = 'Unable to load course data from database: ' + error.message;
                      $log.log("Error getting course from Db: " + error);
                  });
            }, function (error) {
                vm.status = 'Unable to load course data: ' + error.message;
                $log.log(vm.status);
            });
        };

        function createCourse(ultrafied,courseName) {
          rosterService.getRosterFromLearn(vm.config.lti.system_guid, vm.config.lti.course_uuid)
          .then(function (response) {
              var pkRoster = [];
              var uuidRoster = [];
              var i = 0;
              pkRoster = response.data.results;
              var promises = [];
              $log.log("in createCourse");
              angular.forEach(pkRoster, function(value, key) {
                angular.forEach(value,function(pk,jsonKey){//this is nested angular.forEach loop
                  $log.log(jsonKey+":"+pk);
                  var promise = rosterService.getUserByPk(vm.config.lti.system_guid, pk)
                  .then(function(response) {
                    $log.log("createCourse: response=" + JSON.stringify(response));
                    $log.log("createCourse: response=" + JSON.stringify(response.data));
                    var course_role = response.data.courseRoleId === 'Instructor' ? 'INSTRUCTOR' : 'STUDENT';
                    uuidRoster.push({ "user_uuid" : response.data.uuid, "course_role" : course_role });
                    var userInfo = { "first" : response.data.name.given, "last" : response.data.name.family, "email" : response.data.contact.email, "user_uuid" : response.data.uuid, "course_role" : course_role };
                    vm.member.userInfo[response.data.uuid] = userInfo;
                    console.log("UUIDRoster: " + JSON.stringify(uuidRoster));
                  }, function (error) {
                    vm.status = 'Unable to load user by pk1 for ' + pk;

                    $log.log(vm.status);
                  });
                  $log.log("Pushing Promise");
                  promises.push(promise);
                });
              });

              $q.all(promises).then(function () {
                var body = {
                  "uuid" : vm.config.lti.course_uuid,
                  "roster" : uuidRoster,
                  "lists" : [],
                  "ultrafied" : ultrafied
                };
                $log.log(body);

                courseService.createCourse(body);

                vm.course = body;
                vm.course['name'] = courseName;
              });
          });
        };

        function getUser() {
          rosterService.getUserFromLearn(vm.config.lti.system_guid, vm.config.lti.user_uuid)
            .then(function (response) {
                vm.user = response.data;
              }, function (error) {
                  vm.status = 'Unable to load course data: ' + error.message;
                  $log.log(vm.status);
              });
          };

          function loadRoster() {
            rosterService.getRosterFromLearn(vm.config.lti.system_guid, vm.config.lti.course_uuid)
            .then(function (response) {
                var pkRoster = [];
                var uuidRoster = [];
                var i = 0;

                pkRoster = response.data.results;
                $log.log("In loadRoster");
                angular.forEach(pkRoster, function(value, key) {
                  angular.forEach(value,function(pk,jsonKey){//this is nested angular.forEach loop
                    $log.log(jsonKey+":"+pk);
                    rosterService.getUserByPk(vm.config.lti.system_guid, pk)
                    .then(function(response) {
                      var course_role = response.data.courseRoleId === 'Instructor' ? 'INSTRUCTOR' : 'STUDENT';
                      uuidRoster.push({ "user_uuid" : response.data.uuid, "course_role" : course_role });
                      var userInfo = { "first" : response.data.name.given, "last" : response.data.name.family, "email" : response.data.contact.email, "user_uuid" : response.data.uuid, "course_role" : course_role };
                      vm.member.userInfo[response.data.uuid] = userInfo;
                      $log.log("UUIDRoster: " + uuidRoster);
                      $log.log("userInfo: " + vm.member.userInfo);
                    }, function (error) {
                      vm.status = 'Unable to load user by pk1 for ' + pk;

                      $log.log(vm.status);
                    });
                  });
                });
              });
            };

      function getUserById(uuid) {
          $log.log("getUserById: UUID = " + uuid);
          angular.forEach(vm.member.userInfo, function(userInfo,index) {
            $log.log("getUserById: userInfo.user_uuid = " + userInfo.user_uuid);
            if( uuid === userInfo.user_uuid) {
                $log.log("getUserById: returning");
                return userInfo;
            }
          });
      };

      function reserveSpaces(list) {
        var reserves = 0;
        if(list.waitlist_allowed) {
            reserves = list.max_waitlist - calculateTaken(list,false);
        }
        return reserves;
      };

      function calculateTaken(list, main) {
        var count = 0;
        angular.forEach(list.userList, function(user, key) {
          $log.log("calculateTaken: main=" + (main ? "True" : "False") + " waitlisted=" + (user.waitlisted ? "True" : "False"));
          if(main && !user.waitlisted) {
            count++;
            $log.log("main count: " + count);
          } else if (!main && user.waitlisted) {
            $log.log("wait count: " + count);
            count++;
          }
        });

        return count;
      };

      function print(list) {
        alert('Printing ' + list.name + '...');
      };

      function exportList(list) {
        alert('Exporting ' + list.name + '...');
      };
      function createGroup(list) {
        alert('Creating group for ' + list.name + '...');
      };

      /*
       * Instructor adds user
       */
      function addUser(list) {
        alert('Adding User to '  + list.name + '...');

      };

      /*
       * Instructor deletes user
       */
      function delUser(list) {
        alert('Deleting User from ' + list.name + '...');
      };
      function addMe(list, needsWaitlist) {
        var userToAdd = {
          "user_uuid" : vm.user.uuid,
          "role" : vm.config.lti.user_role === 'urn:lti:role:ims/lis/Instructor' ? 'INSTRUCTOR' : 'STUDENT',
          "waitlisted" : needsWaitlist,
          "added_by" : 'self'
        }
        $log.log("UserToAdd: " + JSON.stringify(userToAdd));
        listInCourseScope = $filter('filter')(vm.course.lists, function (d) {return d.uuid === list.uuid;})[0];
        $log.log("User list length before add: " + list.userList.length);
        listInCourseScope.userList.push(userToAdd);
        $log.log("User list length: " + list.userList.length);
        membershipService.addGroupMember(list.uuid, group.uuid, userToAdd)
          .then(function (response) {
            vm.status = 'User added to list!';
            $log.log(vm.status);
          }, function(error) {
            vm.status = 'Unable to add user to course: ' + error;
            $log.log(vm.status);
          });

      };
      function delMe(list) {
        $log.log("delMe: User list length before filter: " + list.userList.length);
        listInCourseScope = $filter('filter')(vm.course.lists, function (d) {return d.uuid === list.uuid;})[0];
        angular.forEach(listInCourseScope.userList, function(userInfo,index) {
          $log.log("delMe: userInfo = " + userInfo.user_uuid);
          if( vm.config.lti.user_uuid === userInfo.user_uuid) {
            listInCourseScope.userList.splice(index);
            $log.log("delMe: User list length: " + list.userList.length);
          }
        });
        membershipService.deleteGroupMember(list.uuid, group.uuid, vm.config.lti.user_uuid)
          .then(function (response) {
            vm.status = 'delMe: User deleted from list!';
            $log.log(vm.status);
          }, function(error) {
            vm.status = 'Unable to delete user from list: ' + error;
            $log.log(vm.status);
          });
        loadRoster();
      };
      function emailList(list) {
        alert('Emailing ' + list.name + '...');
      };

      function addList() {
        dbService.createList(vm.list)
          .then(function (response) {
            $log.log("list id: " + response.data._id);
            vm.course.lists.push({ "_id": response.data._id });
            $log.log(vm.course.lists);
            dbService.updateCourse(vm.config.lti.course_uuid, vm.course)
              .then(function (response) {
                vm.status = 'List Added.';
                $log.log(vm.status);
                vm.config.addList = false;
                vm.list = {};
                getCourse(vm.config.lti.system_guid, vm.config.lti.course_uuid);
              }, function (error) {
                vm.status = 'Unable to save course data: ' + error;
                $log.log(vm.status);
              });
        }, function (error) {
          vm.status = 'Unable to create list: ' + error;
          $log.log(vm.status);
        });
      };

      function userInList(list) {
        $log.log("Getting ready to search vm.course.lists by " + list.uuid);
        listInCourseScope = $filter('filter')(vm.course.lists, function (c) {$log.log("c.uuid is " + c.uuid); return c.uuid === list.uuid;})[0];
        $log.log("listInCourseScope.uuid is :");
        $log.log(listInCourseScope.uuid);
        if(listInCourseScope.userList.length === 0 ) {
          $log.log("userInList: returning false");
          return false;
        } else {
          $log.log("userInList: Getting userInListScope");
          userInListScope = $filter('filter')(listInCourseScope.userList, function (l) {return l.user_uuid === vm.config.lti.user_uuid;})[0];
          $log.log("userInListScope: " + JSON.stringify(userInListScope));
          return userInListScope ? true : false;
        }
        $log.log("userInList: Returning the default false. userList exists, but current user is not in it");
        return false;
      };
    }
})();
