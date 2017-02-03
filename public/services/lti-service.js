angular.module('ltiService', ['ngResource']).
       factory('LtiService', [
           '$resource',
           function ($resource) {
               return $resource('/lti/data',
                   {},
                   {
                       submit: {
                           method: 'GET'
                       },
                   });
           }
       ]);
