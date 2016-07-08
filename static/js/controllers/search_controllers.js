'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.controllers.search',
[
  'communityshare.controllers.conversation'
]);

module.controller(
'MatchesController',
function($scope, Session, Search, $location, labelMapping, makeDialog,
         startConversation, Messages, $modal) {
  $scope.Session = Session;
  $scope.labelMapping = labelMapping;
  $scope.labelClasses = {
    gradeLevels: 'grade-level-button',
    engagementLevels: 'engagement-button',
    subjectAreas: 'subject-area-button',
    undefined: 'subject-area-button'
  };
  var user = Session.activeUser;
  $scope.infoMessage = 'Loading searches...';
  $scope.errorMessage = '';
  $scope.title = '';
  $scope.goToConversation = function(conversation) {
    $location.path('/conversation/' + conversation.id);
  };

  $scope.showThankYou = function() {
    $modal.open({
      templateUrl: './static/templates/educator_thankyou.html',
      controller: 'ModalController'
    });
  };

  var showModal = $location.search().first;
  if (showModal) {
    $scope.showThankYou();
  }

  if (user) {
    var searchesPromise = Search.get_many({'searcher_user_id': user.id}, true);
    searchesPromise.then(
      function(searches) {
        $scope.infoMessage = '';
        $scope.errorMessage = '';
        $scope.searches = searches;
        var compareSearchDate = function(search1, search2) {
          var output = -1;
          if (search1.created === search2.created) {
            output = 0;
          } else if (search1.created < search2.created) {
            output = 1;
          }
          return output;
        };
        $scope.searches.sort(compareSearchDate);
        var gotSomeMatches = false;
        $scope.page = 0;
        var page = $scope.page;
        for (var i=0; i<$scope.searches.length; i++) {
          var search = $scope.searches[i];
          if ((!gotSomeMatches) && (search.labels.length > 0)) {
            $scope.getMatches(search, page);
            gotSomeMatches = true;
          }
        }
      }
    );
  }
  $scope.getMatches = function(search, page) {
    $scope.page = page;
    var matchesPromise = Search.getResults(search.id, page);
    search.show = true;
    search.infoMessage = 'Loading matches...';
    search.errorMessage = '';
    matchesPromise.then(
      function(matches) {
        search.matches = matches;
        search.infoMessage = '';
        search.errorMessage = '';
      },
      function(errorMessage) {
        search.infoMessage = '';
        search.errorMessage = errorMessage;
      });
  };
  $scope.startConversation = startConversation;
  $scope.editProfile = function() {
    $location.path('settings');
  };
  $scope.deleteSearch = function(search) {
    var title = 'Delete Search';
    var msg = 'Do you really want to delete this search?  Others will no longer be able to find you by matching to the contents of this search.';
    var btns = [{result:'yes', label: 'Yes'},
                {result:'no', label: 'No', cssClass: 'btn-primary'}];
    var d = makeDialog(title, msg, btns);
    d.result.then(
      function(result) {
        if (result === 'yes') {
          var deletePromise = search.destroy();
          deletePromise.then(
            function() {
            },
            function(message) {
                Messages.error(message);
            });
        }
      });
  };
  $scope.goToPage = function (search, page) {
    $scope.page = page;
    $scope.getMatches(search, page);
  };
  $scope.paginationRange = function (max) {
    var pages, min, i;
    min = $scope.page;
    pages = [];

    if (min < 5) {
      min = 0;
      max = 5;
    }

    if (min >= 5) {
      max = min + 2;
      min -= 2;
    }

    for (i = min; i <= max; i++) {
      pages.push(i);
    }
    return pages;
  };
});

module.controller(
'SearchResultsController',
function(Session, $scope, $location, $routeParams, $modal, Search, Messages, labelMapping) {
  $scope.Session = Session;
  var searchId = $routeParams.searchId;
  $scope.infoMessage = 'Searching for matches...';
  $scope.errorMessage = '';
  $scope.title = '';
  $scope.goToConversation = function(conversation) {
    $location.path('/conversation/' + conversation.id);
  };

  $scope.labelClasses = {
    gradeLevels: 'light-yellow-button',
    engagementLevels: 'light-blue-button',
    subjectAreas: 'light-green-button',
    undefined: 'light-green-button'
  };
  $scope.labelMapping = labelMapping;

  if (searchId !== undefined) {
    var searchesPromise = Search.getResults(searchId);
    searchesPromise.then(
      function(searches) {
        $scope.searches = searches;
        if (searches.length === 0) {
          $scope.infoMessage = 'No matches found.';
        } else {
          $scope.infoMessage = '';
          if (searches[0].searcher_role === 'educator') {
            $scope.title = 'Best Educator Matches';
          } else {
            $scope.title = 'Best Community Partner Matches';
          }
        }
        $scope.errorMessage = '';
      },
      function(message) {
        var msg = '';
        if (message) {
          msg = ': ' + message;
        }
        $scope.errorMessage = 'Failed to find matches' + msg;
      });
  }
});

module.controller(
'SearchEditController',
function(Session, $location, $scope, $routeParams, Search, Messages) {
  $scope.Session = Session;
  var searchId = $routeParams.searchId;
  if (searchId !== undefined) {
    var searchPromise = Search.get(searchId);
    searchPromise.then(
      function(search) {
        $scope.search = search;
      },
      function(message) {
        Messages.error(message);
      });
  } else {
    var searcher_role;
    var searching_for_role;
    if (Session.activeUser.is_educator) {
      searcher_role = 'educator';
      searching_for_role = 'partner';
    } else {
      searcher_role = 'partner';
      searching_for_role = 'educator';
    }
    $scope.search = new Search({
      searcher_user_id: Session.activeUser.id,
      searcher_role: searcher_role,
      searching_for_role: searching_for_role,
      zipcode: Session.activeUser.zipcode,
      labels: []
    });
  }

  $scope.saveSettings = function() {
    var promise = $scope.search.save();
    promise.then(
      function() {
        $location.path('/matches');
      },
      function(message) {
        Messages.error(message);
      });
  };

  $scope.searchText = {value: ''};
  $scope.userSearch = function() {
    if ($scope.searchText.value) {
      $location.path('/searchusers/' + $scope.searchText.value);
    }
  };
});

module.controller(
'SearchUsersController',
function($scope, $location, $q, User, Session, $routeParams, parseyyyyMMdd,
         startConversation) {
  $scope.Session = Session;
  $scope.startConversation = startConversation;
  $scope.infoMessage = 'Searching for matching users...';
  $scope.users = undefined;
  $scope.prevSearchText = $routeParams.searchText;
  $scope.searchText = {value: $routeParams.searchText};
  var start = $routeParams.created_start;
  if (start) {
    start = parseyyyyMMdd(start);
  }
  var stop = $routeParams.created_stop;
  if (stop) {
    stop = parseyyyyMMdd(stop);
  }
  $scope.start = start;
  $scope.stop = stop;
  var searchForUsers = function() {
    var searchParams = {
      'date_created.greaterthan': start,
      'date_created.lessthan': stop,
      'search_text': $routeParams.searchText
    };
    var searchPromise = User.search(searchParams);
    searchPromise.then(
      function(results) {
        var addedIds = {};
        var uniqueUsers = [];
        var users;
        if (results.byName === undefined) {
          users = results;
        } else {
          users = results.byName.concat(results.byEmail);
        }
        for (var i=0; i<users.length; i++) {
          var user = users[i];
          if (!(user.id in addedIds)) {
            uniqueUsers.push(user);
            addedIds[user.id] = true;
          }
        }
        var compare = function(a, b) {
          var aUC = a.name.toUpperCase();
          var bUC = b.name.toUpperCase();
          if (aUC > bUC) {
            return 1;
          } else if (aUC < bUC) {
            return -1;
          } else {
            return 0;
          }
        };
        uniqueUsers.sort(compare);
        $scope.users = uniqueUsers;
        $scope.infoMessage = '';
        $scope.errorMessage = '';
      },
      function(message) {
        var msg = '';
        if (message) {
          msg = ': ' + message;
        }
        $scope.errorMessage = 'Failed to load users' + msg;
        $scope.infoMessage = '';
      });
  };
  searchForUsers();
  $scope.newSearch = function() {
    $location.path('/searchusers/' + $scope.searchText.value);
  };
});

