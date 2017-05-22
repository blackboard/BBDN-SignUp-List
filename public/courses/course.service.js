// Courses factory
angular
  .module('signupApp')
  .factory('courseService', courseService);

courseService.$inject = ['$http'];

function courseService($http) {
  return {
    createCourse: createCourse,
    deleteAllLists: deleteAllLists,
    deleteCourse: deleteCourse,
    getCourse: getCourse,
    getCourseFromLearn: getCourseFromLearn,
    getCourses: getCourses,
    patchCourse: patchCourse,
    updateCourse: updateCourse
  };

  function createCourse(course) {
    return $http.post('/courses', course);
  }

  function deleteAllLists(courseId) {
    return $http.delete('/courses/' + courseId + '/lists');
  }

  function deleteCourse(courseId) {
    return $http.delete('/courses/' + courseId);
  }

  function getCourse(courseId) {
    return $http.get('/courses/' + courseId);
  }

  function getCourseFromLearn(systemId, courseId) {
    return $http.get('/api/system/' + systemId + '/course/' + courseId);
  }

  function getCourses() {
    return $http.get('/courses');
  }

  function patchCourse(courseId, course) {
    return $http.patch('/courses/' + courseId, course);
  }

  function updateCourse(courseId, course) {
    return $http.put('/courses/' + courseId, course);
  }
}
