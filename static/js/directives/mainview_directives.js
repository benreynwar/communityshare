'use strict';

var angular = require( 'angular' );

var module = angular.module('communityshare.directives.mainview', [
'ui.bootstrap.alert'
]);

module.directive(
'csRegistrationWrapper',
function() {
  return {
    templateUrl: '/static/templates/registration_wrapper.html',
    transclude: true
  };
});

module.directive(
'csStandardWrapper',
function() {
  return {
    templateUrl: '/static/templates/standard_wrapper.html',
    transclude: true
  };
});

module.directive(
'csSplashWrapper',
function() {
  return {
    templateUrl: '/static/templates/splash_wrapper.html',
    transclude: true
  };
});

module.directive(
'csSideNav',
function() {
  return {
    templateUrl: '/static/templates/sidenav.html',
    replace: true
  };
});

module.directive(
'csNavBar',
function() {
  return {
    templateUrl: '/static/templates/navbar.html',
    controller: 'NavbarController',
    replace: true
  };
});

module.directive(
'csFooter',
function() {
  return {
    templateUrl: '/static/templates/footer.html',
    replace: true
  };
});

module.directive(
'csUserAgreement',
function() {
  return {
    templateUrl: '/static/templates/user_agreement.html'
  };
});

module.directive(
'csForbidden',
function(Session) {
  return {
    templateUrl: '/static/templates/forbidden.html',
    controller: function($scope, $location) {
      $scope.thisLocation = $location.path();
      if (!(Session.activeUser)) {
        $location.path('/login').search('goto', $scope.thisLocation);
      }
    }
  };
});

module.directive(
'csDatepicker',
function() {
  return {
    scope: {
      'ngModel': '='
    },
    templateUrl: '/static/templates/datepicker.html',
    controller: function($scope) {

      $scope.today = function() {
        $scope.ngModel = new Date();
      };

      $scope.clear = function () {
        $scope.ngModel = null;
      };

      $scope.minDate = new Date();
      $scope.maxDate = new Date();
      $scope.maxDate.setFullYear($scope.maxDate.getFullYear()+1);

      $scope.open = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.opened = true;
      };

      $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
      };
    }
  };
});


// These directive based upon:
// http://stackoverflow.com/questions/21466495/using-angularjs-how-do-i-set-all-form-fields-to-dirty-at-once

module.directive('formSubmitted', function () {
return {
  restrict: 'A',
  require: 'form',
  link: function (scope, element) {
    scope.submitted = false;
    element.on('submit', function () {
      scope.$apply(function () {
        scope.submitted = true;
      });
    });
  }
};
});

module.directive(
'inputErrorHelper',
function () {
  return {
    restrict: 'A',
    require: '^form',
    scope: {
      inputTag: '@',
      fieldName: '@'
    },

    link: function (scope, element, attrs, formController) {

      var inputTagType = scope.inputTag || 'input';
      var inputElement = element.find(inputTagType);
      var fieldName = scope.fieldName || inputElement.attr('name');
      var formScope = element.scope();

      scope.makeDirty = function() {
        var field = formController[fieldName];
        field.$setViewValue(field.$viewValue);
      };

      formScope.$watch('submitted', function (submitted) {
        if (submitted) {
          scope.makeDirty();
        }
      });
      inputElement.bind('blur', function() {
        scope.$apply(function() {
          scope.makeDirty();
        });
      });
    }
  };
});
