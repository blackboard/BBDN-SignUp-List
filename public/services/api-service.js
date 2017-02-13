angular.module('signupApp')
.factory('apiFactory', ['$http', function($http) {

    var urlBase = '/api';
    var apiFactory = {};

    apiFactory.getCourse = function (systemId, courseId) {
        return $http.get(urlBase + '/system/' + systemId + '/course/' + courseId);
    };

    apiFactory.getUser = function (systemId, userId) {
        return $http.get(urlBase  + '/system/' + systemId + '/user/' + userId);
    };

    apiFactory.getRoster = function (systemId, courseId) {
        return $http.get(urlBase  + '/system/' + systemId + '/course/' + courseId + '/users');
    };

    apiFactory.createGroup = function (systemId, courseId, groupName) {
        return $http.post(urlBase  + '/system/' + systemId + '/course/' + courseId + '/group/' + groupName);
    };

    apiFactory.AddUsersToGroup = function (systemId, courseId, groupId, userId) {
        return $http.post(urlBase  + '/system/' + systemId + '/course/' + courseId + '/group/' + groupName + '/user/' + userId);
    };

    return apiFactory;
}]);
