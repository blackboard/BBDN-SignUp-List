// List Factory
angular
  .module('signupApp')
  .factory('listService', listService);

listService.$inject = ['$http'];

function listService($http) {
  return {
    addList: addList,
    deleteList: deleteList,
    deleteLists: deleteLists,
    getList: getList,
    getLists: getLists,
    updateList: updateList//,
    //updateLists: updateLists
  };

  function addList(list) {
      return $http.post('/lists', list);
  }

  function deleteList(list) {
      return $http.delete('/lists/' + list._Id);
  }

  function deleteLists(courseId) {
      return $http.delete('/courses/ ' + courseId + '/lists');
  }

  function getList(list) {
      return $http.get('/lists' + list._Id);
  }

  function getLists() {
      return $http.get('/lists');
  }

  function updateList(list) {
      return $http.patch('/lists/' + list._Id, list);
  }

  //function updateLists(systemId, courseId, list) {
  //    return $http.patch('/list/course/' + systemId + '/' + courseId + '/list/' + list._Id, list);
  //}
}
