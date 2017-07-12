(function() {
    'use strict';

    angular
        .module('signupApp')
        .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope', '$log', '$q', '$filter', '$location', '$interval', 'courseService', 'groupService', 'ltiService', 'listService', 'membershipService', 'rosterService', 'modalService'];

    /* @ngInject */
    function SignupController($scope, $log, $q, $filter, $location, $interval, courseService, groupService, ltiService, listService, membershipService, rosterService, modalService) {
      var vm = this;

      vm.access_token = "";
      vm.addList = addList;
      vm.addGroup = addGroup;
      vm.addMe = addMe;
      vm.addUser = addUser;
      vm.calculateTaken = calculateTaken;
      vm.calOps = {
        minDate : null,
        maxDate : null
      };
      vm.calOpsUpdate = calOpsUpdate;
      vm.config = {};
      vm.config.add_list = false;
      vm.config.showInfo = false;
      vm.config.showMembers = false;
      vm.course = {};
      vm.courseRoster = [];
      vm.dataSync = dataSync;
      vm.deleteAllGroupsInLearn = deleteAllGroupsInLearn;
      vm.createGroup = createGroup;
      vm.dateIntId = '';
      vm.deleteGroup = deleteGroup;
      vm.deleteGroupInLearn = deleteGroupInLearn;
      vm.deleteList = deleteList;
      vm.delMe = delMe;
      vm.delUser = delUser;
      vm.editGroup = editGroup;
      vm.editList = editList;
      vm.emailList = emailList;
      vm.exportData = [];
      vm.exportHeaders = exportHeaders;
      vm.getLink = getLink;
      vm.exportList = exportList;
      vm.generateLti = generateLti;
      vm.getData = getLtiData;
      vm.getExportData = getExportData;
      vm.getList = getList;
      vm.getUserById = getUserById;
      vm.group = {};
      vm.groups = [];
      vm.grpEndIsOpen = false;
      vm.grpStartIsOpen = false;
      vm.intervalId = '';
      vm.list = {};
      vm.listEndIsOpen = false;
      vm.listStartIsOpen = false;
      vm.member = {};
      vm.member.userInfo = [];
      vm.minDate = '';
      vm.maxDate = '';
      vm.newList = newList;
      vm.oneAtATime = true;
      vm.openListStartCal = openListStartCal;
      vm.openListEndCal = openListEndCal;
      vm.openGroupStartCal = openGroupStartCal;
      vm.openGroupEndCal = openGroupEndCal;
      vm.pickUser = false;
      vm.print =  print;
      vm.reserveSpaces = reserveSpaces;
      vm.select  = function(list_uuid) {
        vm.accordianState[list_uuid] = !vm.accordianState[list_uuid];
        $log.log("[ACCSTATE] : vm.accordianState:" + JSON.stringify(vm.accordianState));
      }
      vm.getAccState = function(list_uuid) {
        return vm.accordianState[list_uuid];
      }
      vm.singleList = {};
      vm.source = null;
      vm.accordianState = [];
      vm.user = {};
      vm.userInList = userInList;

      activate();

      function activate() {
        vm.getData();
      }

      // listen on DOM destroy (removal) event, and cancel the next UI update
      // to prevent updating time after the DOM element was removed.
      $scope.$on('$destroy', function() {
        $interval.cancel(vm.intervalId);
        $interval.cancel(vm.dateIntId);
      });

      function getLtiData() {
        ltiService.getData()
          .then(function (response) {
              $log.log("Got Response Yo!");
              vm.config.lti = response.data;
              vm.config.lti.debug_mode = true;
              var promises = [];
              var promise;
              promise=getCourse();
              promises.push(promise);
              promise=getUser();
              promises.push(promise);
              promise=loadRoster();
              promises.push(promise);

              $q.all(promises).then(function() {
                dateManagement();
                createAcState();
                vm.intervalId = $interval(dataSync, 1000);
                vm.dateIntId = $interval(dateManagement, 30000);
              })
          }, function (error) {
              vm.status = 'Unable to load lti data: ' + error.message;
              $log.log(vm.status);
          });
      };

      function createAcState() {
        angular.forEach(vm.course.list, function(list,key) {
          vm.accordianState[list.list_uuid] = false;
        });
      }

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
                      if(vm.config.lti.list_id != '') {
                        vm.getList();
                      }
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
          //$log.log("getUserById: UUID = " + uuid);
          return $filter('filter')(vm.courseRoster, function (c)
          {
            //$log.log("c.user_uuid is " + c.user_uuid);
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
          //$log.log("calculateTaken: main=" + (main ? "True" : "False") + " waitlisted=" + (user.waitlisted ? "True" : "False"));
          if(main && !user.waitlisted) {
            count++;
            //$log.log("main count: " + count);
          } else if (!main && user.waitlisted) {
            //$log.log("wait count: " + count);
            count++;
          }
        });

        return count;
      };

      function exportHeaders() {
          return [
            'list_name',
            'group_name',
            'user_uuid',
            'first_name',
            'last_name',
            'email',
            'role',
            'date_added',
            'date_modified',
            'added_by',
            'waitlisted'
          ];
      };

      function getExportData() {
        return vm.exportData;
      }

      function exportList(list,group) {

        var deferred = $q.defer();
        var promises = [];
        vm.exportData.length = 0;

        var promise = angular.forEach(group.grp_members, function(user, key) {
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

          $log.log("Pushing Promise");
          promises.push(promise);
        });

        $q.all(promises).then(function () {
          $log.log("all promises resolved. exportData \n");
          $log.log(JSON.stringify(vm.exportData));
          deferred.resolve(vm.exportData);
          return vm.exportData;
        });

        return deferred.promise;
      };

      function createGroup(list,group) {
          //systemId, courseId, group
          groupService.addGroupInLearn(vm.config.lti.system_guid,vm.course.uuid,group).then(function(result) {
            $log.log("Created Group. Now add users.");
            angular.forEach(group.grp_members, function(user, key) {
              $log.log("Pk1: "+user.user_uuid + " role: " + user.role);

              if (!user.waitlisted) {
                membershipService.addGroupMemberInLearn(vm.config.lti.system_guid,vm.course.uuid,result.data.id,user.user_uuid).then(function(result) {
                  $log.log("Added user " + user.user_uuid + " to group " + group.grp_name + " in Learn.");
                });
              };
            });

            group.grp_learn_group = true;

            groupService.updateGroup(list.list_uuid, group).then(function (response) {
              var listIndex = vm.course.lists.indexOf(list);
              var index = vm.course.lists[listIndex].list_groups.indexOf(group);
              $log.log("group index: " + index);
              vm.course.lists[listIndex].list_groups[index].grp_learn_group = true;
              $log.log(JSON.stringify(vm.course.lists[listIndex].list_groups));
            });
          });
      };

      function deleteGroupInLearn(list,group,internal) {
        var promises = [];

        var dialogText = "Are you sure you want to delete group '" + group.grp_name + "' from the Learn course?";
        $log.log("[DELGRP] dialogText: " + dialogText);
        $log.log("[DELGRP] list.list_uuid: <" + list.list_uuid + ">");

        modalService.showModal(
        { scope: $scope, templateUrl: '/layout/confirmation-dialog.html' },
        { headerText: 'Confirm Learn Group Deletion', dialogText : dialogText })
        .then(function (result) {
          angular.forEach(group.grp_members, function(user, key) {
            $log.log("Pk1: "+user.user_uuid + " role: " + user.role);

            if(!user.waitlisted) {
              var promise = membershipService.deleteGroupMemberInLearn(vm.config.lti.system_guid,vm.course.uuid,group.grp_name,user.user_uuid).then(function(result) {
                $log.log("Removed user " + user.user_uuid + " to group " + group.grp_name + " in Learn.");
              });

              promises.push[promise];
            }
          });

          $q.all(promises).then( function() {
            groupService.deleteGroupInLearn(vm.config.lti.system_guid,vm.course.uuid,group).then(function(result) {
              $log.log("Deleted Group");
            });

            if(!internal) {
              group.grp_learn_group = false;

              groupService.updateGroup(list.list_uuid, group).then(function (response) {
                var listIndex = vm.course.lists.indexOf(list);
                var index = vm.course.lists[listIndex].list_groups.indexOf(group);
                $log.log("group index: " + index);
                vm.course.lists[listIndex].list_groups[index].grp_learn_group = false;
                $log.log(JSON.stringify(vm.course.lists[listIndex].list_groups));
              });
            }
          });
        });
      };

      function deleteAllGroupsInLearn(list) {
        var listsWithGroups = [];

        listsWithGroups = $filter('filter')(list.list_groups, function (c) {$log.log("c.grp_learn_group is " + c.grp_learn_group); return c.grp_learn_group === true;});

        $log.log("listsWithGroups Length: " + listsWithGroups.length);

        var dialogText = "You are deleting list '" + list.list_name + "', which contains groups in Learn. Do you want to delete them, as well?";
        $log.log("[DELGRP] dialogText: " + dialogText);
        $log.log("[DELGRP] list.list_uuid: <" + list.list_uuid + ">");

        modalService.showModal(
        { scope: $scope, templateUrl: '/layout/confirmation-dialog.html' },
        { headerText: 'Confirm Bulk Learn Group Deletion', dialogText : dialogText })
        .then(function (result) {
          angular.forEach(listsWithGroups, function(group, key) {
            var promises = [];

            angular.forEach(group.grp_members, function(user,uKey) {

              $log.log("Pk1: "+user.user_uuid + " role: " + user.role);

              if(!user.waitlisted) {
                var promise = membershipService.deleteGroupMemberInLearn(vm.config.lti.system_guid,vm.course.uuid,group.grp_name,user.user_uuid).then(function(result) {
                  $log.log("Removed user " + user.user_uuid + " to group " + group.grp_name + " in Learn.");
                });

                promises.push[promise];
              }
            });

            $q.all(promises).then( function() {
              groupService.deleteGroupInLearn(vm.config.lti.system_guid,vm.course.uuid,group).then(function(result) {
                $log.log("Deleted Group");
              });
            });
          });
        });
      };

      function deleteGroup(list,group,) {
        var dialogText = "Are you sure you want to delete group '" + group.grp_name + "'?";
        $log.log("[DELGRP] dialogText: " + dialogText);
        $log.log("[DELGRP] list.list_uuid: <" + list.list_uuid + ">");

        modalService.showModal(
        { scope: $scope, templateUrl: '/layout/confirmation-dialog.html' },
        { headerText: 'Confirm Group Deletion', dialogText : dialogText })
        .then(function (result) {
            $log.log("Deleting group " + group.grp_name);

            if(list.list_uuid === undefined) {
              var index = vm.groups.indexOf(group);
              $log.log("undefined list: index: " + index);
              vm.groups.splice(index,1);
              $log.log(JSON.stringify(vm.groups));
              vm.group = {};
            }
            else {
              var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {$log.log("c.list_uuid is " + c.list_uuid); return c.list_uuid === list.list_uuid;})[0];
              $log.log("listInCourseScope.uuid is :");
              $log.log(listInCourseScope.list_uuid);
              $log.log(JSON.stringify(listInCourseScope.list_groups));
              $log.log(JSON.stringify(group));

              var groupInListScope = $filter('filter')(listInCourseScope.list_groups, function (d) {$log.log("d.grp_uuid is " + d.grp_uuid); return d.grp_uuid === group.grp_uuid;})[0];
              $log.log("groupInListScope.uuid is :");
              $log.log(groupInListScope.grp_uuid);
              $log.log(JSON.stringify(groupInListScope));

              var index = listInCourseScope.list_groups.indexOf(groupInListScope);
              $log.log("index: " + index);
              listInCourseScope.list_groups.splice(index,1);
              $log.log(JSON.stringify(listInCourseScope.list_groups));

              vm.groups = listInCourseScope.list_groups;

              groupService.deleteGroup(list.list_uuid, group.grp_uuid).then(function (response) {
                $log.log("response: " + JSON.stringify(response));
                $log.log("Group " + group.grp_name + " deleted from list " + list.list_name);

                if(group.grp_learn_group) {
                  vm.deleteGroupInLearn(list, group, true);
                }
              }, function (error) {
                $log.log("Group " + vm.group.grp_name + " delete failed: " + error.status + ": " + error.statusText);
                vm.group = {};

              });
            }
          }, $log.log("Deleting Group."));
      };

      function deleteList(list) {
        var dialogText = "Are you sure you want to delete the list '" + list.list_name + "'?";

        modalService.showModal(
          { scope: $scope, templateUrl: '/layout/confirmation-dialog.html' },
          { headerText: 'Confirm List Deletion', dialogText : dialogText })
          .then(function (result) {
              $log.log("Deleting list " + list.list_name);

              listService.deleteList(list).then(function (response) {
                $log.log("List " + list.list_name + " deleted.");
                var index = vm.course.lists.indexOf(list);
                $log.log("index: " + index);
                vm.course.lists.splice(index,1);

                if(list.list_groups.length > 0) {
                  vm.deleteAllGroupsInLearn(list);
                }

                vm.list = {};
                vm.group = {};
                vm.groups = {};
              }, function (error) {
                $log.log("List " + list.list_name + " add failed: " + error.status + ": " + error.statusText);
                vm.list = {};
                vm.group = {};
                vm.groups = {};
              });

          }, $log.log("Deleting List."));
      };

      /*
       * Instructor adds user
       */
      function addUser(group, list) {
        vm.list = list;
        vm.group = group;
        modalService.showModal({ scope: $scope, templateUrl: '/people/member-picker.html' },{ headerText: 'Select a User to Add' }).then(function (waitlisted) {
            $log.log("Waitlisted: " + waitlisted + " or, in case its JSON: " + JSON.stringify(waitlisted));
            $log.log("New User UUID is: " + vm.userToAdd);

            var newUser = {
              "user_uuid" : vm.userToAdd,
              "role" : 'STUDENT',
              "waitlisted" : waitlisted,
              "added_by" : vm.user.userName
            }

            var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {$log.log("c.list_uuid is " + c.list_uuid); return c.list_uuid === list.list_uuid;})[0];
            $log.log("listInCourseScope.uuid is :");
            $log.log(listInCourseScope.list_uuid);

            var grpInListScope = $filter('filter')(listInCourseScope.list_groups, function (d) {$log.log("d.grp_uuid is " + d.grp_uuid); return d.grp_uuid === group.grp_uuid;})[0];
            $log.log("grpInListScope.uuid is :");
            $log.log(grpInListScope.grp_uuid);

            if(grpInListScope.grp_members.length >= grpInListScope.grp_max_size) {
              $log.log("List is full");
              if(waitlisted) {
                $log.log("Adding to waitlist");
                if(!grpInListScope.grp_waitlist_allowed) {
                  $log.log("Creating Waitlist")
                  grpInListScope.grp_waitlist_allowed = true;
                  grpInListScope.grp_max_waitlist = 1;
                }
                else {
                  if(!vm.reserveSpaces(grpInListScope)) {
                    $log.log("Adding Space for new waitlist member: " + grpInListScope.grp_max_waitlist);
                    grpInListScope.grp_max_waitlist++;
                    $log.log("Space added for new waitlist member: " + grpInListScope.grp_max_waitlist);
                  }
                }
              }
              else {
                $log.log("Adding space for new group member: " + grpInListScope.grp_max_size);
                grpInListScope.grp_max_size++;
                $log.log("Space added for new group member: " + grpInListScope.grp_max_size);
              }
            }

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
        grpInListScope.grp_members.splice(index,1);

        groupMemberRoller(list,group);

        groupService.updateGroup(list.list_uuid, grpInListScope).then(function (response) {
          $log.log("Removed " + user_uuid + " from group " + group.grp_name + " in list " + list.list_name);
        }, function (error) {
          $log.log("User " + user_uuid + " removal failed: " + error.status + ": " + error.statusText);
        });

      };

      function addMe(list, group, needsWaitlist) {
        var userToAdd = {
          "user_uuid" : vm.user.uuid,
          "role" : vm.config.lti.user_role === 'instructor' ? 'INSTRUCTOR' : 'STUDENT',
          "waitlisted" : needsWaitlist,
          "added_by" : 'self'
        }

        $log.log("UserToAdd: " + JSON.stringify(userToAdd));
        var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {return c.list_uuid === list.list_uuid;})[0];
        var groupInListScope = $filter('filter')(listInCourseScope.list_groups, function (d) {return d.grp_uuid === group.grp_uuid;})[0];
        $log.log("User list length before add: " + groupInListScope.grp_members.length);
        groupInListScope.grp_members.push(userToAdd);
        $log.log("User list length: " + groupInListScope.grp_members.length);
        membershipService.addGroupMember(list.list_uuid, groupInListScope.grp_uuid, userToAdd).then(function (response) {
          $log.log("User " + userToAdd.user_uuid + " added to group " + group.grp_name);

          userToAdd = null;
        }, function (error) {
          $log.log("User " + userToAdd.user_uuid + " add failed: " + error.status + ": " + error.statusText);
        });

      };
      function delMe(list,group) {
        var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {return c.list_uuid === list.list_uuid;})[0];
        var groupInListScope = $filter('filter')(listInCourseScope.list_groups, function (d) {return d.grp_uuid === group.grp_uuid;})[0];
        var userInGroupScope = $filter('filter')(groupInListScope.grp_members, function (e) {return e.user_uuid === vm.config.lti.user_uuid;})[0];

        $log.log("delMe: User list length before filter: " + groupInListScope.grp_members.length);
        var index = groupInListScope.grp_members.indexOf(userInGroupScope);
        $log.log("index: " + index);
        groupInListScope.grp_members.splice(index,1);

        membershipService.deleteGroupMember(list.list_uuid, group.grp_uuid, vm.config.lti.user_uuid)
          .then(function (response) {
            vm.status = 'delMe: User deleted from list!';
            $log.log(vm.status);
            groupMemberRoller(list,group);
          }, function(error) {
            vm.status = 'Unable to delete user from list: ' + error;
            $log.log(vm.status);
          });
        //loadRoster();
      };

      function emailList(list) {
        alert('Emailing ' + list.name + '...');
      };

      function addList() {
        var promises = [];
        var listId;
        var list_uuid;
        listService.addList(vm.list)
          .then(function (response) {
            listId = response.data._id;
            list_uuid = response.data.list_uuid;
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
              vm.accordianState[list_uuid] = true;
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

      function editList(list) {

        vm.list = list;

        vm.list.list_visible_start = new Date(vm.list.list_visible_start);
        vm.list.list_visible_end = new Date(vm.list.list_visible_end)

        vm.groups = list.list_groups;

        modalService.showModal({ scope: $scope, templateUrl: '/lists/new-list.html' },{ headerText: 'Edit List' }).then(function (result) {

            $log.log("Editing List: " + vm.list.list_name);

            list.list_groups = vm.groups;

            //TODO: Add  call to listService.updateList(list);
            listService.updateList(list).then(function (result) {
              $log.log("[EDITLIST] RESULT: " + JSON.stringify(result));

              vm.list = {};
              vm.groups = {};
            });

        }, $log.log("Adding List."));
      }

      function editGroup (list, group) {
        group.grp_start = new Date(group.grp_start);
        group.grp_end = new Date(group.grp_end);

        vm.group = group;

        modalService.showModal({ scope: $scope, templateUrl: '/groups/new-group.html' },{ headerText: 'Edit Group' }).then(function (result) {

          groupService.updateGroup(list.list_uuid, vm.group).then(function (response) {
            $log.log("Group " + vm.group.grp_name + " added to list " + list.list_name);
            var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {$log.log("c.list_uuid is " + c.list_uuid); return c.list_uuid === list.list_uuid;})[0];
            $log.log("listInCourseScope.uuid is :");
            $log.log(listInCourseScope.list_uuid);
            var index = listInCourseScope.list_groups.indexOf(vm.group);
            listInCourseScope.list_groups[index] = vm.group;
            vm.group = {};
          }, function (error) {
            $log.log("Group " + vm.group.grp_name + " edit failed: " + error.status + ": " + error.statusText);
            vm.group = {};
          });
        }, $log.log("Editing Group."));
      }

      function getList() {
        $log.log("[GETLIST] listId: " + vm.config.lti.list_id)
        if(vm.config.lti.list_id != '') {
          vm.singleList = $filter('filter')(vm.course.lists, function (c) {$log.log("[GETLIST] c.list_uuid is " + c.list_uuid); return c.list_uuid === vm.config.lti.list_id;})[0];
        }
      }

      function generateLti(list) {
        vm.list = list;
        modalService.showModal({ scope: $scope, templateUrl: '/layout/generate-lti.html' },{ headerText: 'Generate List LTI Link' }).then(function (result) {
            $log.log("[GENLTI] Task Complete!");
        }, $log.log("[GENLTI] Generating LTI Link"));
      }

      function getLink() {
        $log.log("[GETLINK] " + $location.absUrl() + '?list=' + vm.list.list_uuid);
        return $location.absUrl() + '?list=' + vm.list.list_uuid;
      }

      function dataSync() {
        courseService.getCourse(vm.config.lti.course_uuid)
          .then(function (response) {
            vm.course = response.data;
            if(vm.config.lti.list_id != '') {
                vm.getList();
            }
          }, function (error) {
              $interval.cancel(vm.intervalId);
              vm.status = 'Unable to load course data from database: ' + error.message + '\nClearing Interval to prevent runaway process.';
              $log.log(vm.status);
        });
      };

      function dateManagement() {

        var now = new Date();
        $log.log("[DM] now: " + now);

        angular.forEach(vm.course.lists, function(list, lKey) {
          var listStart = new Date(list.list_visible_start);
          var listEnd = new Date(list.list_visible_end);
          $log.log("[DM] list_name: " + list.list_name + " list start: " + listStart + " list end: " + listEnd);
          if (list.list_state === 'OPEN' && (now < listStart || now >= listEnd) ) {
            list.list_state='CLOSED';
            $log.log("[DM] list_state: " + list.list_state);
            listService.updateList(list).then(function(response) {
              $log.log("[DM] List " + list.list_name + " Closed.");
            }, function(error) {
              $log.log("[DM] Error closing list " + list.list_name + ": " + error.status + ": " + error.statusText);
            });
          } else if (list.list_state === 'CLOSED' && now >= listStart && now < listEnd ) {
            list.list_state='OPEN';
            $log.log("[DM] list_state: " + list.list_state);
            listService.updateList(list).then(function(response) {
              $log.log("[DM] List " + list.list_name + " Opened.");
            }, function(error) {
              $log.log("[DM] Error opening list " + list.list_name + ": " + error.status + ": " + error.statusText);
            });
          };
          angular.forEach(list.list_groups, function(group, gKey) {
            var grpStart = new Date(group.grp_start);
            var grpEnd = new Date(group.grp_end);

            $log.log("[DM] group_name: " + group.grp_name + " group start: " + grpStart + " group end: " + grpEnd);
            if (group.grp_state === 'OPEN' && (now < grpStart || now >= grpEnd || list.list_state === 'CLOSED') ) {
              group.grp_state='CLOSED';
              $log.log("[DM] grp_state: " + group.grp_state);
              groupService.updateGroup(list.list_uuid, group).then(function(response) {
                $log.log("[DM] Group " + group.grp_name + " Closed.");
              }, function(error) {
                $log.log("[DM] Error closing group " + group.grp_name + ": " + error.status + ": " + error.statusText);
              });
            } else if (group.grp_state === 'CLOSED' && now >= grpStart && now < grpEnd && list.list_state === 'OPEN') {
              group.grp_state='OPEN';
              $log.log("[DM] grp_state: " + group.grp_state);
              groupService.updateGroup(list.list_uuid, group).then(function(response) {
                $log.log("[DM] Group " + group.grp_name + " Opened.");
              }, function(error) {
                $log.log("[DM] Error opening group " + group.grp_name + ": " + error.status + ": " + error.statusText);
              });
            };
          });
        });
      };

    function groupMemberRoller(list,group) {
      $log.log("[GRPROLL] =============================================");
      if(group.grp_waitlist_allowed) {
        $log.log("[GRPROLL] Waitlist allowed");
        if(calculateTaken(group,true) < group.grp_max_size) {
          $log.log("[GRPROLL] Room on list");
          if(calculateTaken(group,false) > 0) {
            $log.log("[GRPROLL] people waiting");
            var oldestDate = Date.now();
            var userToPromote = '';
            angular.forEach(group.grp_members, function(user,key) {
              $log.log("[GRPROLL] check user");
              if(user.waitlisted) {
                $log.log("[GRPROLL] user waitlisted: " + user.user_uuid);
                var userModified = new Date(user.modified);
                if(oldestDate > userModified) {
                  $log.log("[GRPROLL] setting user to be promoted: " + user.user_uuid);
                  oldestDate = userModified;
                  userToPromote = user.user_uuid;
                };
              };
            });

            var listInCourseScope = $filter('filter')(vm.course.lists, function (c) {$log.log("c.list_uuid is " + c.list_uuid); return c.list_uuid === list.list_uuid;})[0];
            $log.log("[GRPROLL] listInCourseScope.uuid is :");
            $log.log("[GRPROLL] " + listInCourseScope.list_uuid);

            var grpInListScope = $filter('filter')(listInCourseScope.list_groups, function (d) {$log.log("d.grp_uuid is " + d.grp_uuid); return d.grp_uuid === group.grp_uuid;})[0];
            $log.log("[GRPROLL] grpInListScope.uuid is :");
            $log.log("[GRPROLL] " + grpInListScope.grp_uuid);

            var usrInGrpScope = $filter('filter')(grpInListScope.grp_members, function (e) {$log.log("e.user_uuid is " + e.user_uuid); return e.user_uuid === userToPromote;})[0];
            $log.log("[GRPROLL] usrInGrpScope.user_uuid is :");
            $log.log("[GRPROLL] " + usrInGrpScope.user_uuid);
            usrInGrpScope.waitlisted = false;

            groupService.updateGroup(list.list_uuid, grpInListScope).then(function (response) {
              $log.log("[GRPROLL] Group " + vm.group.grp_name + " added to list " + list.list_name);

              userToPromote = null;
            }, function (error) {
              $log.log("[GRPROLL] User " + userToPromote + " promotion failed: " + error.status + ": " + error.statusText);
            });
          }
        }
      }
    };

    function calOpsUpdate(start,date) {

      if(start) {
        vm.calOps.minDate = new Date(date);
        var tmpDate = vm.calOps.minDate.toISOString();
        vm.minDate = tmpDate.slice(0,-1);
        $log.log("minDate - Ops:" + vm.calOps.minDate + " val: " + vm.minDate);
      } else {
        vm.calOps.maxDate = new Date(date);
        var tmpDate = vm.calOps.maxDate.toISOString();
        vm.maxDate = tmpDate.slice(0,-1);
        $log.log("maxDate - Ops:" + vm.calOps.maxDate + " val: " + vm.maxDate);
      }
    };
  }
})();
