'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.controllers.misc',
[
  'communityshare.services.authentication',
  'communityshare.services.modal',
  'communityshare.services.statistics',
  'communityshare.services.message'
]);

module.controller(
'ModalController',
function($scope, $modalInstance) {
  $scope.closeModal = function() {
    $modalInstance.close();
  };
});

module.controller(
'NavigationController',
function($scope, Session, Authenticator, $location) {
  $scope.Session = Session;
  $scope.logout = function() {
    Authenticator.clean();
    $location.path('');
  };
});

module.controller(
'MainController',
function($scope, Session) {
  $scope.Session = Session;
});

module.controller(
'AdminController',
function(Session, $scope, $location, $http, getStatistics) {
  $scope.Session = Session;
  $scope.searchText = {value: ''};
  $scope.now = new Date();
  $scope.tomorrow = new Date();
  $scope.tomorrow.setDate($scope.tomorrow.getDate()+1);
  $scope.daysAgo7 = new Date();
  $scope.daysAgo7.setDate($scope.daysAgo7.getDate()-6);
  $scope.daysAgo30 = new Date();
  $scope.daysAgo30.setDate($scope.daysAgo7.getDate()-29);
  $scope.searchForUsers = function() {
    var searchParams = {
      'searchText': $scope.searchText.value
    };
    $location.path('/searchusers').search(searchParams);
  };
  $scope.activateEmails = function () {
    $http({
      method: 'POST',
      url: '/api/activate_email'
    })
  };
  $scope.outputUserData = function () {
    $http({
      method: 'GET',
      url: '/api/dump_csv'
    })
    .success(function (data, status, headers, config) {
      console.log(data);
    })
    .error(function (data, status, headers, config) {
      console.log(status);
    })
  };
  var statisticsPromise = getStatistics();
  $scope.statistics = [];
  statisticsPromise.then(function(statistics) {
    for (var dateString in statistics) {
      var date = new Date(dateString);
      statistics[dateString].date = date;
      $scope.statistics.push(statistics[dateString]);
    }
    var comp = function(a, b) {
      if (a.date > b.date) {
        return 1;
      } else if (a.date < b.date) {
        return -1;
      } else {
        return 0;
      }
    };
    $scope.statistics.sort(comp);
    var l = $scope.statistics.length;
    $scope.statisticsDate = $scope.statistics[l-1].date;
    $scope.nTotalUsers = $scope.statistics[l-1].n_total_users;
    $scope.nTotalEvents = $scope.statistics[l-1].n_total_events_done;
    $scope.nUpcomingEvents = $scope.statistics[l-1].n_upcoming_events;
    $scope.newUsersIn7Days = 0;
    $scope.eventsIn7Days = 0;
    for (var i=0; i<7; i++) {
      $scope.newUsersIn7Days += $scope.statistics[l-1-i].n_new_users;
      $scope.eventsIn7Days += $scope.statistics[l-1-i].n_events_done;
    }
    $scope.newUsersIn30Days = $scope.newUsersIn7Days;
    $scope.eventsIn30Days = $scope.eventsIn7Days;
    for (var j=7; j<30; j++) {
      $scope.newUsersIn30Days += $scope.statistics[l-1-j].n_new_users;
      $scope.eventsIn30Days += $scope.statistics[l-1-j].n_events_done;
    }
  });
});

module.controller(
'NavbarController',
function($scope, Messages, Session, $modal, Authenticator, $location,
         makeDialog) {
  $scope.deleteAccount = function() {
    var title = 'Delete Account';
      var msg = 'Do you really want to delete your Community Share account?';
    var btns = [{result:'yes', label: 'Yes'},
                {result:'no', label: 'No', cssClass: 'btn-primary'}];
    var d = makeDialog(title, msg, btns);
    d.result.then(
      function(result) {
        if (result === 'yes') {
          var deletePromise = Session.activeUser.destroy();
          deletePromise.then(
            function() {
              Authenticator.clean();
              $location.path('/');
            },
            function(message) {
                Messages.error(message);
            });
        }
      });
  };
});

