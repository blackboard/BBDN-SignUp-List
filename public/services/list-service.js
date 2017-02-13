angular.module('signupApp')
.factory('listFactory', ['$http', function($http) {

    var urlBase = '/list';
    var listFactory = {};

    listFactory.getLists = function (systemId, courseId) {
        return $http.get(urlBase + '/course/' + systemId + '/' + courseId);
    };

    listFactory.getList = function (systemId, courseId, list) {
        return $http.get(urlBase + '/course/' + systemId + '/' + courseId + '/list/' + list._Id);
    };

    listFactory.addList = function (systemId, courseId, list) {
        return $http.post(urlBase + '/course/' + systemId + '/' + courseId, list);
    };

    listFactory.updateList = function (systemId, courseId, list) {
        return $http.patch(urlBase + '/course/' + systemId + '/' + courseId + '/list/' + list._Id, list);
    };

    listFactory.deleteList = function (systemId, courseId, list) {
        return $http.delete(urlBase + '/course/' + systemId + '/' + courseId + '/list/' + list._Id);
    };

    return listFactory;
}]);
