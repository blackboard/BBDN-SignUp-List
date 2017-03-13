angular.module('signupApp')
.controller('SignupController', [
    '$scope', '$log', '$q', '$filter', 'resourceCache', 'ltiFactory', 'listFactory', 'apiFactory', 'dbFactory',
    function ($scope, $log, $q, $filter, resourceCache, ltiFactory, listFactory, apiFactory, dbFactory) {

        $scope.config = {};
        $scope.config.debug_mode = true;
        $scope.config.add_list = false;
        $scope.config.showMembers = false;
        $scope.config.showInfo = false;

        $scope.access_token = "";
        $scope.user = {};
        $scope.course = {};
        $scope.member = {};

        $scope.getData = getLtiData;
        $scope.getMember = getUserById;
        $scope.reserveSpaces = reserveSpaces;
        $scope.print =  print;
        $scope.exportList = exportList;
        $scope.createGroup = createGroup;
        $scope.addUser = addUser;
        $scope.delUser = delUser;
        $scope.addMe = addMe;
        $scope.delMe = delMe;
        $scope.emailList = emailList;
        $scope.userInList = userInList;
        $scope.addList = addList;
        $scope.calculateTaken = calculateTaken;

        $scope.list = {};

        function getLtiData() {
          ltiFactory.getData()
            .then(function (response) {
                $scope.config.lti = response.data;
                getCourse();
                getUser();
                loadRoster();
            }, function (error) {
                $scope.status = 'Unable to load lti data: ' + error.message;
                $log.log($scope.status);
            });
        };

        function getCourse() {
          apiFactory.getCourse($scope.config.lti.system_guid, $scope.config.lti.course_uuid)
            .then(function (response) {
                var ultraStatus = response.data.ultraStatus;
                var ultrafied = ultraStatus === 'Ultra' || ultraStatus === 'UltraPreview' ? true : false;
                var courseName = response.data.name;
                dbFactory.getCourse($scope.config.lti.course_uuid)
                  .then(function (response) {
                      if(!response.data) {
                        createCourse(ultrafied,courseName);
                      } else {
                        $scope.course = response.data;
                        $scope.course['name'] = courseName;
                      }
                    }, function (error) {
                        $scope.status = 'Unable to load course data from database: ' + error.message;
                        $log.log("Error getting course from Db: " + error);
                    });
              }, function (error) {
                  $scope.status = 'Unable to load course data: ' + error.message;
                  $log.log($scope.status);
              });
          };

          function createCourse(ultrafied,courseName) {
            apiFactory.getRoster($scope.config.lti.system_guid, $scope.config.lti.course_uuid)
            .then(function (response) {
                var pkRoster = [];
                var uuidRoster = [];
                var i = 0;

                pkRoster = response.data.results;
                var promises = [];

                angular.forEach(pkRoster, function(value, key) {
                  angular.forEach(value,function(pk,jsonKey){//this is nested angular.forEach loop
                    $log.log(jsonKey+":"+pk);
                    var promise = apiFactory.getUserByPk($scope.config.lti.system_guid, pk)
                    .then(function(response) {
                      var course_role = response.data.courseRoleId === 'Instructor' ? 'INSTRUCTOR' : 'STUDENT';
                      uuidRoster.push({ "user_uuid" : response.data.uuid, "course_role" : course_role });
                      resourceCache.put(response.data.uuid, { "first" : response.data.name.given, "last" : response.data.name.family, "email" : response.data.contact.email, "user_uuid" : response.data.uuid, "course_role" : course_role });
                      console.log("UUIDRoster: " + uuidRoster);
                    }, function (error) {
                      $scope.status = 'Unable to load user by pk1 for ' + pk;

                      $log.log($scope.status);
                    });
                    promises.push(promise);
                  });
                });

                $q.all(promises).then(function () {
                  var body = {
                    "uuid" : $scope.config.lti.course_uuid,
                    "roster" : uuidRoster,
                    "lists" : [],
                    "ultrafied" : ultrafied
                  };
                  $log.log(body);

                  dbFactory.createCourse(body);

                  $scope.course = body;
                  $scope.course['name'] = courseName;
                });
            });
          };

          function getUser() {
            apiFactory.getUser($scope.config.lti.system_guid, $scope.config.lti.user_uuid)
              .then(function (response) {
                  $scope.user = response.data;
                }, function (error) {
                    $scope.status = 'Unable to load course data: ' + error.message;
                    $log.log($scope.status);
                });
            };

            function loadRoster() {
              apiFactory.getRoster($scope.config.lti.system_guid, $scope.config.lti.course_uuid)
              .then(function (response) {
                  var pkRoster = [];
                  var uuidRoster = [];
                  var i = 0;

                  pkRoster = response.data.results;

                  angular.forEach(pkRoster, function(value, key) {
                    angular.forEach(value,function(pk,jsonKey){//this is nested angular.forEach loop
                      $log.log(jsonKey+":"+pk);
                      apiFactory.getUserByPk($scope.config.lti.system_guid, pk)
                      .then(function(response) {
                        var course_role = response.data.courseRoleId === 'Instructor' ? 'INSTRUCTOR' : 'STUDENT';
                        uuidRoster.push({ "user_uuid" : response.data.uuid, "course_role" : course_role });
                        resourceCache.put(response.data.uuid, { "first" : response.data.name.given, "last" : response.data.name.family, "email" : response.data.contact.email, "user_uuid" : response.data.uuid, "course_role" : course_role });
                        console.log("UUIDRoster: " + uuidRoster);
                      }, function (error) {
                        $scope.status = 'Unable to load user by pk1 for ' + pk;

                        $log.log($scope.status);
                      });
                    });
                  });
                });
              };

            function getUserById(user) {
                return resourceCache.get(user.uuid);
              };

        function reserveSpaces(list) {
          return list.max_waitlist - calculateTaken(list,false);
        };

        function calculateTaken(list, main) {
          var count = 0;
          $log.log("In calculateTaken");
          angular.forEach(list.userlist, function(value, key) {
            $log.log("Value: " + value + " Key: " + key);
            angular.forEach(value,function(user,userKey){
              $log.log("User: " + user + " userKey: " + userKey);
              if(userKey === "user_uuid") {
                if(main && !user.waitlisted) {
                  count++;
                  $log.log("main count: " + count);
                } else if (!main && user.waitlisted) {
                  $log.log("wait count: " + count);
                  count++;
                }
              }
            });
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
        function addUser(list) {
          alert('Adding User to '  + list.name + '...');
        };
        function delUser(list) {
          alert('Deleting User from ' + list.name + '...');
        };
        function addMe(list, needsWaitlist) {
          var userToAdd = {
            "user_uuid" : $scope.user.uuid,
            "role" : $scope.config.lti.user_role === 'urn:lti:role:ims/lis/Instructor' ? 'INSTRUCTOR' : 'STUDENT',
            "waitlist" : needsWaitlist,
            "added_by" : 'self'
          }
          $log.log("User list length before filter: " + list.userlist.length);
          listInCourseScope = $filter('filter')($scope.course.lists, function (d) {return d.uuid === list.uuid;})[0];
          listInCourseScope.userlist.push(userToAdd);
          $log.log("User list length: " + list.userlist.length);
          dbFactory.updateList(list.uuid, list)
            .then(function (response) {
              $scope.status = 'User added to list!';
              $log.log($scope.status);
            }, function(error) {
              $scope.status = 'Unable to add user to course: ' + error;
              $log.log($scope.status);
            });

        };
        function delMe(list) {
          alert('Deleting ' + $scope.user.userName + '...');
        };
        function emailList(list) {
          alert('Emailing ' + list.name + '...');
        };

        function addList() {
          //$scope.course.lists.push($scope.list);
          dbFactory.createList($scope.list)
            .then(function (response) {
              $log.log("list id: " + response.data._id);
              $scope.course.lists.push({ "_id": response.data._id });
              $log.log($scope.course.lists);
              dbFactory.updateCourse($scope.config.lti.course_uuid, $scope.course)
                .then(function (response) {
                  $scope.status = 'List Added.';
                  $log.log($scope.status);
                  $scope.config.addList = false;
                  $scope.list = {};
                  getCourse($scope.config.lti.system_guid, $scope.config.lti.course_uuid);
                }, function (error) {
                  $scope.status = 'Unable to save course data: ' + error;
                  $log.log($scope.status);
                });
          }, function (error) {
            $scope.status = 'Unable to create list: ' + error;
            $log.log($scope.status);
          });
        };

        function userInList(list) {
          return(false);
        };
    }])
