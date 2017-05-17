angular
  .module('signupApp')
  .factory('listFactory', listFactory);

listFactory.$inject = ['$http'];

function listFactory($http) {
  return {
    addList: addList,
    deleteList: deleteList,
    getList: getList,
    getLists: getLists,
    updateList: updateList
  };

  function getLists(systemId, courseId) {
      return $http.get('/list/course/' + systemId + '/' + courseId);
  }

  function getList(systemId, courseId, list) {
      return $http.get('/list/course/' + systemId + '/' + courseId + '/list/' + list._Id);
  }

  function addList(systemId, courseId, list) {
      return $http.post('/list/course/' + systemId + '/' + courseId, list);
  }

  function updateList(systemId, courseId, list) {
      return $http.patch('/list/course/' + systemId + '/' + courseId + '/list/' + list._Id, list);
  }

  function deleteList(systemId, courseId, list) {
      return $http.delete('/list/course/' + systemId + '/' + courseId + '/list/' + list._Id);
  }
}
