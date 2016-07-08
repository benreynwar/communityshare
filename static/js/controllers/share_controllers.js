'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.controllers.share',
[
  'communityshare.services.share',
  'communityshare.services.conversation'
]);

module.controller(
'SharesController',
function(Session, $scope, Share, startConversation) {
  $scope.Session = Session;
  $scope.startConversation = startConversation;
  if ($scope.Session.activeUser) {
    var sharesPromise = Share.get_many({'user_id': Session.activeUser.id}, true);
    $scope.errorMessage = '';
    $scope.infoMessage = 'Loading shares...';
    sharesPromise.then(
      function(shares) {
        $scope.errorMessage = '';
        $scope.infoMessage = '';
        $scope.shares = shares;
        var sortedShares = Share.sortShares(shares);
        $scope.futureShares = sortedShares.future;
        $scope.pastShares = sortedShares.past;
      },
      function(errorMessage) {
        $scope.errorMessage = errorMessage;
      });
  }
});

module.controller(
'ShareController',
function(Session, $scope, $routeParams, Share) {
  $scope.Session = Session;
  var shareId = $routeParams.shareId;
  if (shareId !== undefined) {
    var sharePromise = Share.get(shareId);
    sharePromise.then(
      function(share) {
        $scope.share = share;
      },
      function(message) {
        var msg = 'Failed to load share';
        if (message) {
          msg += ': ' + message;
        }
        $scope.errorMessage = msg;
      });
  }
});


module.controller(
'EditShareController',
function($scope, share, $modalInstance) {
  $scope.share = share;
  $scope.events = share.events;
  $scope.cancel = $modalInstance.close;
  var showErrorMessage = function(message) {
    var msg = 'Failed to save share details';
    if (message) {
      msg += ': ' + message;
    }
    $scope.errorMessage = msg;
  };
  var close = function() {
    $modalInstance.close($scope.share);
  };
  $scope.save = function() {
    for (var i=0; i<$scope.share.events.length; i++) {
      $scope.share.events[i].updateDateTimes();
    }
    var sharePromise = $scope.share.save();
    sharePromise.then(
      close,
      showErrorMessage);
  };
});

module.controller(
'EventsController',
function($scope, $routeParams, Session, Evnt, parseyyyyMMdd) {
  $scope.Session = Session;
  var searchParams = {};
  var start = $routeParams.start;
  if (start) {
    start = parseyyyyMMdd(start);
    searchParams['datetime_start.greaterthan'] = start;
  }
  var stop = $routeParams.stop;
  if (stop) {
    stop = parseyyyyMMdd(stop);
    searchParams['datetime_start.lessthan'] = stop;
  }
  $scope.start = start;
  $scope.stop = stop;
  var eventsPromise = Evnt.get_many(searchParams);
  $scope.infoMessage = 'Loading events...';
  $scope.errorMessage = '';
  eventsPromise.then(
    function(events) {
      $scope.events = events;
      $scope.infoMessage = '';
      $scope.errorMessage = '';
    },
    function(message) {
      $scope.events = [];
      $scope.infoMessage = '';
      var msg = 'Failed to load events';
      if (message) {
        msg += ': ' + message;
      }
      $scope.errorMessage = msg;
    });
});

module.controller(
'EventController',
function($scope, Session, evnt, Question) {
  $scope.Session = Session;
  $scope.evnt = evnt;
  $scope.questions = [];
  var questionsPromise = Question.get_many_with_answers(
    Session.activeUser.id,
    {question_type: 'post_event'},
    {about_event_id: evnt.id}
  );
  questionsPromise.then(
    function(questions) {
      $scope.questions = [];
      // We only show the unanswered questions.
      for (var i=0; i<questions.length; i++) {
        var question = questions[i];
        if (!question.answer.text) {
          question.answer.about_event_id = evnt.id;
          $scope.questions.push(question);
        }
      }
    });
  $scope.questions = [];
  var makeQuestionRemover = function(question) {
    return function() {
      var index = $scope.questions.indexOf(question);
      if (index >= 0) {
        $scope.questions.splice(index, 1);
      }
    };
  };
  $scope.save = function() {
    var allPromises = [];
    var saveAnswerPromises = [];
    for (var i=0; i<$scope.questions.length; i++) {
      var question = $scope.questions[i];
      var answer = question.answer;
      if (answer.text) {
        var saveAnswerPromise = answer.save();
        saveAnswerPromise.then(
          // Wrapping function since it is in a loop.
          makeQuestionRemover(question)
        );
        saveAnswerPromises.push(saveAnswerPromise);
        allPromises.push(saveAnswerPromise);
      }
    }
  };
});

