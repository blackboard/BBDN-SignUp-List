// Membership factory
angular
  .module('signupApp')
  .factory('membershipService', membershipService);

membershipService.$inject = ['$http'];

function membershipService($http) {
  return {
    addGroupMember: addGroupMember,
    addGroupMemberInLearn: addGroupMemberInLearn,
    addGroupMemberList: addGroupMemberList,
    addGroupMemberListInLearn: addGroupMemberListInLearn,
    deleteGroupMember: deleteGroupMember,
    deleteGroupMemberInLearn: deleteGroupMemberInLearn,
    deleteGroupMemberList: deleteGroupMemberList,
    deleteGroupMemberList: deleteGroupMemberList,
    getGroupMember: getGroupMember,
    getGroupMember: getGroupMember,
    getGroupMemberList: getGroupMemberList,
    getGroupMemberListInLearn: getGroupMemberListInLearn,
    updateGroupMember: updateGroupMember,
    updateGroupMemberInLearn: updateGroupMemberInLearn,
    updateGroupMemberList: updateGroupMemberList,
    updateGroupMemberListInLearn: updateGroupMemberListInLearn
  };

  function addGroupMember(listId, groupId, group) {
    return $http.post('/lists/' + listId + '/groups/' + groupId, group);
  }

  function addGroupMemberInLearn(systemId,courseId,groupId,userId) {
    return $http.post('/api/system/' + systemId + '/course/' + courseId + '/' + groupId + '/user/' + userId);
  }

  function addGroupMemberList(courseId) {
    return $http.delete('/courses/' + courseId);
  }

  function addGroupMemberListInLearn(courseId) {
    return $http.delete('/courses/' + courseId);
  }

  function deleteGroupMember(listId, groupId, userId) {
    return $http.delete('/lists/' + listId + '/groups/' + groupId + '/members/' + userId);
  }

  function deleteGroupMemberInLearn(courseId) {
    return $http.get('/courses/' + courseId);
  }

  function deleteGroupMemberList(systemId, courseId) {
    return $http.get('/api/system/' + systemId + '/course/' + courseId);
  }

  function deleteGroupMemberListInLearn(systemId, courseId) {
    return $http.get('/api/system/' + systemId + '/course/' + courseId);
  }

  function getGroupMember() {
    return $http.get('/courses');
  }

  function getGroupMemberInLearn() {
    return $http.get('/courses');
  }

  function getGroupMemberList() {
    return $http.get('/courses');
  }

  function getGroupMemberListInLearn() {
    return $http.get('/courses');
  }

  function updateGroupMember() {
    return $http.get('/courses');
  }

  function updateGroupMemberInLearn() {
    return $http.get('/courses');
  }

  function updateGroupMemberList() {
    return $http.get('/courses');
  }

  function updateGroupMemberListInLearn() {
    return $http.get('/courses');
  }


}
