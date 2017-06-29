(function() {
    'use strict';

    angular
        .module('signupApp')
        .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope', '$log', '$q', '$filter', 'courseService', 'groupService', 'ltiService', 'listService', 'membershipService', 'rosterService', 'modalService'];

    /* @ngInject */
    function SignupController($scope, $log, $q, $filter, courseService, groupService, ltiService, listService, membershipService, rosterService, modalService) {
      var vm = this;

      vm.access_token = "";
      vm.addList = addList;
      vm.addGroup = addGroup;
      vm.addMe = addMe;
      vm.addUser = addUser;
      vm.calculateTaken = calculateTaken;
      vm.config = {};
      vm.config.add_list = false;
      vm.config.showInfo = false;
      vm.config.showMembers = false;
      vm.course = {};
      vm.courseRoster = [];
      vm.createGroup = createGroup;
      vm.delMe = delMe;
      vm.delUser = delUser;
      vm.emailList = emailList;
      vm.exportData = [];
      vm.exportHeaders = [];
      vm.exportList = exportList;
      vm.getData = getLtiData;
      vm.getUserById = getUserById;
      vm.group = {};
      vm.groups = [];
      vm.grpEndIsOpen = false;
      vm.grpStartIsOpen = false;
      vm.list = {};
      vm.listEndIsOpen = false;
      vm.listStartIsOpen = false;
      vm.member = {};
      vm.member.userInfo = [];
      vm.newList = newList;
      vm.oneAtATime = true;
      vm.openListStartCal = openListStartCal;
      vm.openListEndCal = openListEndCal;
      vm.openGroupStartCal = openGroupStartCal;
      vm.openGroupEndCal = openGroupEndCal;
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
          var body = {
            "uuid" : vm.config.lti.course_uuid,
            "externalId" : courseName,
            "lists" : [],
            "ultrafied" : ultrafied
          };
          $log.log(body);

          courseService.createCourse(body).then( function(response) {
            $log.log("CreateCourse response: " + JSON.stringify(response));
            vm.course = response.data;

          }, function (error) {
            vm.status = 'Unable to create course data: ' + error.status + ": " + error.statusText;
            $log.log(vm.status);
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
                    $log.log("Pk1: "+value.userId + " role: " + value.courseRoleId);
                    if(value.courseRoleId == 'Student') {
                      rosterService.getUserByPk(vm.config.lti.system_guid, value.userId)
                      .then(function(response) {
                        var course_role = value.courseRoleId === 'Instructor' ? 'INSTRUCTOR' : 'STUDENT';
                        uuidRoster.push({ "user_uuid" : response.data.uuid, "course_role" : course_role });
                        var userInfo = { "first" : response.data.name.given, "last" : response.data.name.family, "email" : response.data.contact.email, "user_uuid" : response.data.uuid, "course_role" : course_role };
                        vm.courseRoster.push(userInfo);
                        $log.log("UUIDRoster: " + uuidRoster);
                        $log.log("userInfo: " + vm.member.userInfo);
                      }, function (error) {
                        vm.status = 'Unable to load user by pk1 for ' + value.userId;

                        $log.log(vm.status)
                    });
                  }
                });
              });
            };

      function getUserById(uuid) {
          $log.log("getUserById: UUID = " + uuid);
          return $filter('filter')(vm.courseRoster, function (c)
          {
            $log.log("c.user_uuid is " + c.user_uuid);
            return c.user_uuid === uuid;
          })[0];
      };

      function reserveSpaces(list) {
        var reserves = 0;
        if(list.grp_waitlist_allowed) {
            reserves = list.grp_max_waitlist - calculateTaken(list,false);
        }
        return reserves;
      };

      function calculateTaken(list, main) {
        var count = 0;
        angular.forEach(list.grp_members, function(user, key) {
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

      function exportList(list,group) {

        angular.forEach(group.grp_members, function(user, key) {
            $log.log("Pk1: "+user.user_uuid + " role: " + user.role);

            var userInfo = {
              a: list.list_name,
              b: group.grp_name,
              c: user.user_uuid,
              d: getUserById(user.user_uuid).first,
              e: getUserById(user.user_uuid).last,
              f: getUserById(user.user_uuid).email,
              g: user.role,
              h: user.created_on,
              i: user.modified,
              j: user.added_by,
              k: user.waitlisted
            };
            $log.log("userInfo: " + JSON.stringify(userInfo,null,2));
            vm.exportData.push(userInfo);
          });
      };

      function createGroup(list) {
        alert('Creating group for ' + list.name + '...');
      };

      /*
       * Instructor adds user
       */
      function addUser(group, list) {
        vm.list = list;
        vm.group = group;
        modalService.showModal({ scope: $scope, templateUrl: '/people/member-picker.html' },{ headerText: 'Select a User to Add' }).then(function (result) {
            $log.log("New User UUID is: " + vm.userToAdd);

            var newUser = {
              "user_uuid" : vm.userToAdd,
              "role" : 'STUDENT',
              "waitlisted" : false,
              "added_by" : vm.user.userName
            }

            var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {$log.log("c.list_uuid is " + c.list_uuid); return c.list_uuid === list.list_uuid;})[0];
            $log.log("listInCourseScope.uuid is :");
            $log.log(listInCourseScope.list_uuid);

            var grpInListScope = $filter('filter')(listInCourseScope.list_groups, function (d) {$log.log("d.grp_uuid is " + d.grp_uuid); return d.grp_uuid === group.grp_uuid;})[0];
            $log.log("grpInListScope.uuid is :");
            $log.log(grpInListScope.grp_uuid);

            grpInListScope.grp_members.push(newUser);

            groupService.updateGroup(list.list_uuid, grpInListScope).then(function (response) {
              $log.log("Group " + vm.group.grp_name + " added to list " + list.list_name);

              vm.userToAdd = null;
            }, function (error) {
              $log.log("User " + vm.userToAdd + " add failed: " + error.status + ": " + error.statusText);
            });

        }, $log.log("Adding User."));
      };

      /*
       * Instructor deletes user
       */
      function delUser(group, list, user_uuid) {
        vm.list = list;
        vm.group = group;
        $log.log("Deleting User UUID: " + user_uuid);

        var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {$log.log("c.list_uuid is " + c.list_uuid); return c.list_uuid === list.list_uuid;})[0];
        $log.log("listInCourseScope.uuid is :");
        $log.log(listInCourseScope.list_uuid);

        var grpInListScope = $filter('filter')(listInCourseScope.list_groups, function (d) {$log.log("d.grp_uuid is " + d.grp_uuid); return d.grp_uuid === group.grp_uuid;})[0];
        $log.log("grpInListScope.uuid is :");
        $log.log(grpInListScope.grp_uuid);

        var usrInGrpScope = $filter('filter')(grpInListScope.grp_members, function (e) {$log.log("e.user_uuid is " + e.user_uuid); return e.user_uuid === user_uuid;})[0];
        $log.log("usrInGrpScope.uuid is :");
        $log.log(usrInGrpScope.user_uuid);

        var index = grpInListScope.grp_members.indexOf(usrInGrpScope);
        $log.log("index: " + index);
        grpInListScope.grp_members.splice(index);

        groupService.updateGroup(list.list_uuid, grpInListScope).then(function (response) {
          $log.log("Removed " + user_uuid + " from group " + group.grp_name + " in list " + list.list_name);
        }, function (error) {
          $log.log("User " + user_uuid + " removal failed: " + error.status + ": " + error.statusText);
        });

      };

      function addMe(list, needsWaitlist) {
        var userToAdd = {
          "user_uuid" : vm.user.uuid,
          "role" : vm.config.lti.user_role === 'instructor' ? 'INSTRUCTOR' : 'STUDENT',
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
        var promises = [];
        var listId;
        listService.addList(vm.list)
          .then(function (response) {
            listId = response.data._id;
            $log.log("list id: " + response.data._id);
            angular.forEach(vm.groups, function(group,index) {
              $log.log("Adding group UUID: " , group + ", index: " , index);
              var promise = groupService.addGroup(response.data.list_uuid, group)
                .then(function (response) {
                  $log.log("Group " + group.grp_uuid + " added to list " + response.data.list_name);
                }, function (error) {
                  $log.log("Group " + group.grp_name + " add failed: " + error.status + ": " + error.statusText);
                });
                $log.log("Pushing Promise");
                promises.push(promise);
            });

            $q.all(promises).then(function () {
              vm.course.lists.push({ "_id": listId });
              $log.log(vm.course.lists);
              courseService.updateCourse(vm.config.lti.course_uuid, vm.course)
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
            vm.status = 'Unable to create list: ' + error.status + ": " + error.statusText;
            $log.log(vm.status);
          });
        });
      };

      function userInList(list,group,user_uuid) {
        if(!user_uuid) {
          user_uuid = vm.config.lti.user_uuid;
        }
        //$log.log("Getting ready to search vm.course.lists by " + list.list_uuid);
        var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {/*$log.log("c.list_uuid is " + c.list_uuid);*/ return c.list_uuid === list.list_uuid;})[0];
        //$log.log("listInCourseScope.uuid is :");
        //$log.log(listInCourseScope.list_uuid);
        //$log.log("Getting ready to search listInCourseScope by " + group.grp_uuid);
        var groupInCourseScope = $filter('filter')(listInCourseScope.list_groups, function (d) {/*$log.log("d.grp_uuid is " + d.grp_uuid);*/ return d.grp_uuid === group.grp_uuid;})[0];
        //$log.log("groupInCourseScope.uuid is :");
        //$log.log(groupInCourseScope.grp_uuid);
        if(groupInCourseScope.grp_members.length === 0 ) {
          //$log.log("userInList: returning false");
          return false;
        } else {
          //$log.log("userInList: Getting userInListScope");
          var userInListScope = $filter('filter')(groupInCourseScope.grp_members, function (l) {return l.user_uuid === user_uuid;})[0];
          //$log.log("userInListScope: " + JSON.stringify(userInListScope));
          return userInListScope ? true : false;
        }
        //$log.log("userInList: Returning the default false. userList exists, but current user is not in it");
        return false;
      };

      function openListStartCal (e) {
        e.preventDefault();
        e.stopPropagation();
        $log.log("In openListStartCal");
        vm.listStartIsOpen = true;
        vm.listEndIsOpen = false;
        vm.groupStartIsOpen = false;
        vm.groupEndIsOpen = false;
      };

      function openListEndCal (e) {
        e.preventDefault();
        e.stopPropagation();
        $log.log("In openListEndCal");

        vm.listStartIsOpen = false;
        vm.listEndIsOpen = true;
        vm.groupStartIsOpen = false;
        vm.groupEndIsOpen = false;
      };

      function openGroupStartCal (e) {
        e.preventDefault();
        e.stopPropagation();
        $log.log("In openGroupStartCal");

        vm.listStartIsOpen = false;
        vm.listEndIsOpen = false;
        vm.groupStartIsOpen = true;
        vm.groupEndIsOpen = false;
      };

      function openGroupEndCal (e) {
        e.preventDefault();
        e.stopPropagation();
        $log.log("In openGroupEndCal");

        vm.listStartIsOpen = false;
        vm.listEndIsOpen = false;
        vm.groupStartIsOpen = false;
        vm.groupEndIsOpen = true;
      };

      function addGroup (list, sendDbNotification) {
        modalService.showModal({ scope: $scope, templateUrl: '/groups/new-group.html' },{ headerText: 'Add a Group' }).then(function (result) {
            $log.log("New Group Name is: " + vm.group.grp_name);
            vm.group.grp_members = [];
            vm.group.isOpen = false;



            if(sendDbNotification) {
              groupService.addGroup(list.list_uuid, vm.group).then(function (response) {
                $log.log("Group " + vm.group.grp_name + " added to list " + list.list_name);
                var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {$log.log("c.list_uuid is " + c.list_uuid); return c.list_uuid === list.list_uuid;})[0];
                $log.log("listInCourseScope.uuid is :");
                $log.log(listInCourseScope.list_uuid);
                listInCourseScope.list_groups.push(vm.group);
                vm.group = {};
              }, function (error) {
                $log.log("Group " + vm.group.grp_name + " add failed: " + error.status + ": " + error.statusText);
                vm.group = {};
              });
            } else {
              vm.groups.push(vm.group);
              vm.group = {};
            }

        }, $log.log("Adding Group."));
      }

      function newList() {
        modalService.showModal({ scope: $scope, templateUrl: '/lists/new-list.html' },{ headerText: 'Create New List' }).then(function (result) {
            $log.log("New List Name is: " + vm.list.list_name);

            vm.addList();
        }, $log.log("Adding List."));
      }
  }
})();
