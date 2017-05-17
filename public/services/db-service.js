angular
  .module('signupApp')
  .factory('dbFactory', dbFactory);

dbFactory.$inject = ['$http'];

function dbFactory($http) {
  return {
    createCourse: createCourse,
    createList: createList,
    getCourse: getCourse,
    updateCourse: updateCourse,
    updateList: updateList
  };

  function getCourse(courseId) {
      return $http.get('/courses/' + courseId);
  }

  function createCourse(course) {
      return $http.post('/courses', course);
  }

  function updateCourse(courseId, course) {
      return $http.put('/courses/' + courseId, course);
  }

  function createList(list) {
      return $http.post('/lists', list);
  }

  function updateList(listId, list) {
      return $http.put('/lists/' + listId, list);
  }
}
