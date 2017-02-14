angular.module('signupApp')
.factory('ltiFactory', ['$http', function ($http) {
  var urlBase = '/lti/data';
  var ltiFactory = {};

  ltiFactory.getData = function () {
      return $http.get(urlBase);
  };

  return ltiFactory;
}]);
