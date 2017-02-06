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
                var css = $scope.lti.shared_css.split(",");
                $scope.lti.shared = css[0];
                $scope.lti.theme = css[1];
              },
              function (response) {
                alert('error');
              });
        }
    }
]);
