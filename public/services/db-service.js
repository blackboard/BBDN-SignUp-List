angular.module('signupApp')
.factory('dbFactory', ['$http', function($http) {

    var dbFactory = {};

    dbFactory.getCourse = function (courseId) {
        return $http.get('/courses/' + courseId);
    };

    dbFactory.createCourse = function (course) {
        return $http.post('/courses', course);
    };

    dbFactory.updateCourse = function (courseId, course) {
        return $http.put('/courses/' + courseId, course);
    };

    dbFactory.createList = function (list) {
        return $http.post('/lists', list);
    };

    dbFactory.updateList = function (listId, list) {
        return $http.put('/lists/' + listId, list);
    };

    return dbFactory;
}]);
