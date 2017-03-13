angular.module("signupApp").
  directive("preloadResource", ["resourceCache",
    function(resourceCache) {
      return { link: function (scope, element, attrs) {
        resourceCache.put(attrs.preloadResource, element.html());
      }};
    }
  ]);
