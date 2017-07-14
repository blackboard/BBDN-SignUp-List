angular.module('signupApp')
.config(['$translateProvider', function($translateProvider) {
  $translateProvider
    .useStaticFilesLoader({
      prefix: '/languages/locale-',
      suffix: '.lang.json'
    })
    .preferredLanguage('en-US');
}]);
