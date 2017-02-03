angular.module('signupApp', [])
  .controller('SignupController', [
    '$scope', '$http',
    function ($scope, $http) {

        $scope.lti = {};

        $scope.getLtiData = getLtiData;

        function getLtiData() {

            $http.get('/lti/data')
              .then(function (response) {
                $scope.lti = response.data;
              },
              function (response) {
                alert('error');
              });
        }
    }
]);
