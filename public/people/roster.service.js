// Roster factory
angular
  .module('signupApp')
  .factory('rosterService', rosterService);

rosterService.$inject = ['$http'];

function rosterService($http) {
  return {
    deleteRoster: deleteRoster,
    deleteUserFromRoster: deleteUserFromRoster,
    getRoster: getRoster,
    getRosterFromLearn: getRosterFromLearn,
    getUserFromLearn: getUserFromLearn,
    getUserByPk: getUserByPk,
    getUserFromRoster: getUserFromRoster,
  };


  function deleteRoster(courseId) {
    return $http.delete('/courses/' + courseId + '/roster');
  }

  function deleteUserFromRoster(courseId, userId) {
    return $http.delete('/courses/' + courseId + '/roster/' + userId);
  }

  function getRoster(courseId) {
    return $http.get('/courses/' + courseId + '/roster');
  }

  function getRosterFromLearn(systemId, courseId) {
    return $http.get('/api/system/' + systemId + '/course/' + courseId + '/roster');
  }

  function getUserFromLearn(systemId, userId) {
      return $http.get('/api/system/' + systemId + '/user/' + userId);
  }

  function getUserByPk(systemId, userId) {
      return $http.get('/api/system/' + systemId + '/user_pk/' + userId);
  }

  function getUserFromRoster(courseId, userId) {
    return $http.get('/courses/' + courseId + '/roster/' + userId);
  }
}
