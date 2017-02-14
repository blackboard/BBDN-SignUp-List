angular.module('signupApp')
.controller('SignUpSummaryController', ['$scope', function($scope) {
  $scope.summary = [
    {
      name: 'List 1',
      total: 3,
      taken: 1,
      wtotal: 3,
      wtaken: 0,
      state: 'Open',
      group: 'Tutorial 1'
    },
    {
      name: 'List 2',
      total: 3,
      taken: 3,
      wtotal: 3,
      wtaken: 0,
      state: 'Open',
      group: 'Tutorial 2'
    },
    {
      name: 'List 3',
      total: 2,
      taken: 1,
      wtotal: 0,
      wtaken: 0,
      state: 'Open',
      group: '-'
    },
    {
      name: 'List 4',
      total: 3,
      taken: 3,
      wtotal: 3,
      wtaken: 3,
      state: 'Closed',
      group: 'Tutorial 4'
    }
  ]
}])
.directive('summaryView', function() {
  return {
    templateUrl: '../views/summary-view.html'
  };
});
