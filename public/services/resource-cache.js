angular.module("signupApp").
  factory("resourceCache",["$cacheFactory",
    function($cacheFactory) { 
      return $cacheFactory("resourceCache");
    }
  ]);
