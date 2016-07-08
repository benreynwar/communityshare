'use strict';

var angular = require( 'angular' );

var module = angular.module('communityshare.directives.survey', [
]);

module.directive(
'csQuestion',
function() {
  return {
    scope: {
      question: '=',
      answers: '='
    },
    controller: function($scope) {
      // Set custom_answer to ' ' so that it is not initally
      // selected.
      $scope.custom_answer = ' ';
    },
    templateUrl: 'static/templates/question.html'
  };
});
