// Group factory
angular
  .module('signupApp')
  .factory('groupService', groupService);

groupService.$inject = ['$http'];

function groupService($http) {
  return {
    addGroup: addGroup,
    addGroupInLearn: addGroupInLearn,
    deleteGroup: deleteGroup,
    deleteGroupInLearn: deleteGroupInLearn,
    getGroup: getGroup,
    getGroupInLearn: getGroupInLearn,
    getGroups: getGroups,
    getGroupsInLearn: getGroupsInLearn,
    updateGroup: updateGroup,
    updateGroupInLearn: updateGroupInLearn
  };

  function addGroup(listId, group) {
    return $http.post('/lists/' + listId + '/groups', group);
  }

  function addGroupInLearn(systemId, courseId, group) {
    return $http.post('/lists/' + listId + '/groups', group);
  }

  function deleteGroup(listId,groupId) {
    return $http.delete('/lists/' + listId + '/groups/' + groupId);
  }

  function deleteGroupInLearn(courseId) {
    return $http.delete('/courses/' + courseId);
  }

  function getGroup(courseId) {
    return $http.get('/courses/' + courseId);
  }

  function getGroupInLearn(systemId, courseId) {
    return $http.get('/api/system/' + systemId + '/course/' + courseId);
  }

  function getGroups() {
    return $http.get('/courses');
  }

  function getGroupsInLearn(courseId, course) {
    return $http.patch('/courses/' + courseId, course);
  }

  function updateGroup(courseId, course) {
    return $http.put('/courses/' + courseId, course);
  }

  function updateGroupInLearn(courseId, course) {
    return $http.put('/courses/' + courseId, course);
  }
}
