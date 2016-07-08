'use strict';

var angular = require( 'angular' );

var module = angular.module('communityshare.services.modal', []);


module.factory(
'makeDialog', function($modal) {
  return function(title, msg, btns) {
    var opts = {
      templateUrl: './static/templates/dialog.html',
      controller: function($scope, $modalInstance, title, msg, btns) {
        $scope.title = title;
        $scope.msg = msg;
        $scope.btns = btns;
        $scope.onClick = function(returnValue) {
          $modalInstance.close(returnValue);
        };
      },
      resolve: {
        'title': function() {return title;},
        'msg': function() {return msg;},
        'btns': function() {return btns;}
      }
    };
    var m = $modal.open(opts);
    return m;
  };
});

