angular.module('signupApp')
.controller('SignupController', [
    '$scope', '$log', 'ltiFactory', 'listFactory', 'apiFactory',
    function ($scope, $log, ltiFactory, listFactory, apiFactory) {

        $scope.config = {};
        $scope.access_token = "";
        $scope.user = {};
        $scope.course = {};
        $scope.config.debug_mode = false;

        $scope.getData = getLtiData;
        $scope.reserveSpaces = reserveSpaces;
        $scope.toggleMemberView = toggleMemberView;
        $scope.print =  print;
        $scope.exportList = exportList;
        $scope.createGroup = createGroup;
        $scope.addUser = addUser;
        $scope.delUser = delUser;
        $scope.addMe = addMe;
        $scope.delMe = delMe;
        $scope.emailList = emailList;
        $scope.userInList = userInList;

        $scope.permissions = {
          viewMembers: false,
          showMembers: false,
        };

        $scope.lists = [
          {
            name: 'List 1',
            total: 3,
            taken: 1,
            wtotal: 3,
            wtaken: 0,
            state: 'Open',
            group: 'Tutorial 1',
            description: "This is a cool list.",
            location: "We'll meet in the lab.",
            showMembers: false,
            members: [
              {
                first: 'Malcolm',
                last: 'Murray',
                email: 'mmurray@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Self'
              },
              {
                first: 'Stephen',
                last: 'Vickers',
                email: 'svickers@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Self'
              },
              {
                first: 'Mark',
                last: 'O\'Neil',
                email: 'moneil@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Professor Plum'
              }
            ]
          },
          {
            name: 'List 2',
            total: 3,
            taken: 3,
            wtotal: 3,
            wtaken: 0,
            state: 'Open',
            group: 'Tutorial 2',
            description: "This list is not quite as good.",
            location: "We'll still meet in the lab.",
            showMembers: false,
            members: [
              {
                first: 'Malcolm',
                last: 'Murray',
                email: 'mmurray@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Self'
              },
              {
                first: 'Stephen',
                last: 'Vickers',
                email: 'svickers@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Self'
              },
              {
                first: 'Mark',
                last: 'O\'Neil',
                email: 'moneil@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Professor Plum'
              }
            ]
          },
          {
            name: 'List 3',
            total: 2,
            taken: 1,
            wtotal: 0,
            wtaken: 0,
            state: 'Open',
            group: '-',
            description: "This list is the worst.",
            location: "We won't be meeting at all with this lot.",
            showMembers: false,
            members: [
              {
                first: 'Malcolm',
                last: 'Murray',
                email: 'mmurray@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Self'
              },
              {
                first: 'Stephen',
                last: 'Vickers',
                email: 'svickers@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Self'
              },
              {
                first: 'Mark',
                last: 'O\'Neil',
                email: 'moneil@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Professor Plum'
              }
            ]
          },
          {
            name: 'List 4',
            total: 3,
            taken: 3,
            wtotal: 3,
            wtaken: 3,
            state: 'Closed',
            group: 'Tutorial 4',
            description: "This is the 007 list.",
            location: "Top Secret. If we haven't told you, you aren't going to know.",
            showMembers: false,
            members: [
              {
                first: 'Malcolm',
                last: 'Murray',
                email: 'mmurray@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Self'
              },
              {
                first: 'Stephen',
                last: 'Vickers',
                email: 'svickers@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Self'
              },
              {
                first: 'Mark',
                last: 'O\'Neil',
                email: 'moneil@myuni.edu',
                role: 'Student',
                groupState: 'Enrolled',
                created: Date.now(),
                addedBy: 'Professor Plum'
              }
            ]
          }
        ];

        function getLtiData() {
          ltiFactory.getData()
            .then(function (response) {
                $scope.config.lti = response.data;
                getCourse();
                getUser();
            }, function (error) {
                $scope.status = 'Unable to load lti data: ' + error.message;
            });
        };

        function getCourse() {
          apiFactory.getCourse($scope.config.lti.system_guid, $scope.config.lti.course_uuid)
            .then(function (response) {
                $scope.course = response.data;
              }, function (error) {
                  $scope.status = 'Unable to load course data: ' + error.message;
              });
          };

          function getUser() {
            apiFactory.getUser($scope.config.lti.system_guid, $scope.config.lti.user_uuid)
              .then(function (response) {
                  $scope.user = response.data;
                }, function (error) {
                    $scope.status = 'Unable to load course data: ' + error.message;
                });
            };

        function reserveSpaces(list) {
          return list.wtotal - list.wtaken;
        };

        function toggleMemberView(index) {
          if($scope.list[index].showMembers) {
            $scope.list[index].showMembers = false
          }
          else {
            $scope.list[index].showMembers = true;
          }
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
        function addMe(list) {
          alert('Adding ' + $scope.user.userName + '...');
        };
        function delMe(list) {
          alert('Deleting ' + $scope.user.userName + '...');
        };
        function emailList(list) {
          alert('Emailing ' + list.name + '...');
        };

        function userInList(list) {
          return(false);
        };
    }])
