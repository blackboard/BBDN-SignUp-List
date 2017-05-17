angular
  .module('signupApp')
  .factory('ltiFactory', ltiFactory);

ltiFactory.$inject = ['$http', '$log'];

function ltiFactory($http, $log) {
  return {
    getData: getData
  };

  function getData() {
      return $http.get('/lti/data');
  }
}
