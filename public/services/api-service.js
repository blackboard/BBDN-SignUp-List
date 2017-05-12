/* // dataservice factory
angular
    .module('app.core')
    .factory('dataservice', dataservice);

dataservice.$inject = ['$http', 'logger'];

function dataservice($http, logger) {
    return {
        getAvengers: getAvengers
    };
*/
angular
  .module('signupApp')
  .factory('apiFactory', apiFactory);

apiFactory.$inject = ['$http'];

function apiFactory($http) {
  return {
    addUsersToGroup: addUsersToGroup,
    createGroup: createGroup,
    getCourse: getCourse,
    getRoster: getRoster,
    getUser: getUser,
    getUserByPk: getUserByPk
  };


  function getCourse(systemId, courseId) {
      return $http.get('/api/system/' + systemId + '/course/' + courseId);
  }

  function getUser(systemId, userId) {
      return $http.get('/api/system/' + systemId + '/user/' + userId);
  }

  function getUserByPk(systemId, userId) {
      return $http.get('/api/system/' + systemId + '/user_pk/' + userId);
  }

  function getRoster(systemId, courseId) {
      return $http.get('/api/system/' + systemId + '/course/' + courseId + '/roster');
  }

  function createGroup(systemId, courseId, groupName) {
      return $http.post('/api/system/' + systemId + '/course/' + courseId + '/group/' + groupName);
  }

  function addUsersToGroup(systemId, courseId, groupId, userId) {
      return $http.post('/api/system/' + systemId + '/course/' + courseId + '/group/' + groupName + '/user/' + userId);
  }
}
