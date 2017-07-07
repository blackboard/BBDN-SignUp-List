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
    updateList: updateList
  };

  function addList(list) {
      return $http.post('/lists', list);
  }

  function deleteList(list) {
      return $http.delete('/lists/' + list.list_uuid);
  }

  function deleteLists(courseId) {
      return $http.delete('/courses/ ' + courseId + '/lists');
  }

  function getList(list) {
      return $http.get('/lists' + list.list_uuid);
  }

  function getLists() {
      return $http.get('/lists');
  }

  function updateList(list) {
      return $http.put('/lists/' + list.list_uuid, list);
  }

}
