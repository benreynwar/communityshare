'use strict';

var angular = require( 'angular' );

var module = angular.module('communityshare.directives.user', [
  'communityshare.services.survey',
  'communityshare.directives.survey'
]);

module.directive(
'csCommunityPartnerView',
function() {
  return {
    scope: {
      methods: '=',
      user: '='},
    templateUrl: './static/templates/community_partner_view.html',
    controller: function(Session, $scope, CommunityPartnerUtils, Search, Messages) {
      $scope.methods.onUserUpdate = function(user) {
        if (user.is_community_partner) {
          var searchesPromise = user.getSearches();
          var searchPromise = CommunityPartnerUtils.searchesPromiseToSearchPromise(
            searchesPromise);
          searchPromise.then(
            function(search) {
              $scope.search = search;
            },
            function(message) {
              Messages.error(message);
            });
        }
      };
      if ($scope.user) {
        $scope.methods.onUserUpdate($scope.user);
      }
    }
  };
});

module.directive(
'csEducatorView',
function() {
  return {
    scope: {
      methods: '=',
      user: '='},
    templateUrl: './static/templates/educator_view.html',
    controller: function(Session, $scope, Search, Messages) {
      $scope.methods.onUserUpdate = function(user) {
        var searchesPromise = user.getSearches();
        searchesPromise.then(
          function(searches) {
            var searchesAsEducator = [];
            for (var i=0; i<searches.length; i++) {
              var search = searches[i];
              if (search.searcher_role === 'educator') {
                searchesAsEducator.push(search);
              }
            }
            $scope.searches = searchesAsEducator;
          },
          function(message) {
            Messages.error(message);
          });
      };
      if ($scope.user) {
        $scope.methods.onUserUpdate($scope.user);
      }
    }
  };
});

module.directive('csParserHook', function() {
return {
  require: 'ngModel',
  scope: {
    methods: '='
  },
  link: function(scope, elem, attrs, ctrl) {
    var methodName = attrs.csParserHook;
    ctrl.$parsers.push(function(value) {
      var output;
      if (scope.methods[methodName]) {
        output = scope.methods[methodName](value);
      }
      return output;
    });
  }
};
});

module.directive('csMatch', function() {
return {
  require: 'ngModel',
  scope: {
    methods: '='
  },
  link: function(scope, elem, attrs, ctrl) {

    var methodName = attrs.csMatch;
    var otherValue;

    var isMatch = function(value1, value2) {
      if (value1 === undefined) {
        value1 = '';
      }
      if (value2 === undefined) {
        value2 = '';
      }
      return (value1 === value2);
    };

    ctrl.$parsers.push(function(value) {
      var output;
      var matches = isMatch(value, otherValue);
      ctrl.$setValidity('match', matches);
      if (matches) {
        output = value;
      }
      return output;
    });

    scope.methods[methodName] = function(value) {
      otherValue = value;
      var matches = isMatch(value, ctrl.$viewValue);
      ctrl.$setValidity('match', matches);
      return value;
    };

  }
};
});

module.directive('emitScope', function() {
return {
  link: function(scope, element, attrs) {
    scope.$emit(attrs.emitScope, scope);
  }
};
});

