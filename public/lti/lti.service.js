// LTI Factory
angular
  .module('signupApp')
  .factory('ltiService', ltiService);

ltiService.$inject = ['$http', '$log'];

function ltiService($http, $log) {
  return {
    getData: getData
  };

  function getData() {
      return $http.get('/lti/data');
  }
}
