'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.controllers.authentication',
[
  'communityshare.services.authentication'
]);

module.controller(
'ResetPasswordController',
function($scope, Authenticator, $routeParams, $location) {
  var key = $routeParams.key;
  $scope.password = {
    password: '',
    repeat_password: ''
  };
  $scope.successfulReset = false;
  $scope.failedReset = false;
  // passwordMethods is used for communication between password and
  // password_repeat directives.
  $scope.passwordMethods = {};
  $scope.resetPassword = function() {
    var promise = Authenticator.resetPassword(key, $scope.password.password);
    promise.then(
      function() {
        $location.path('/login').search({});
        $scope.successfulReset = true;
      },
      function(message) {
        $scope.errorMessage = message;
      });
  };
});

module.controller(
'RequestResetPasswordController',
function($scope, Authenticator) {
  $scope.email = {value: ''};
  $scope.successfulRequest = false;
  $scope.failedRequest = false;
  $scope.requestResetPassword = function() {
    var promise = Authenticator.requestResetPassword($scope.email.value);
    promise.then(
      function() {
        $scope.successfulRequest = true;
        $scope.errorMessage = '';
      },
      function(message) {
        $scope.successfulRequest = false;
        var msg = 'Failed to reset password';
        if (message) {
          if (message === 'Not found') {
            msg += ': ' + 'Unknown email address';
          } else {
            msg += ': ' + message;
          }
        }
        $scope.errorMessage = msg;
      });
  };
});

module.controller(
'ConfirmEmailController',
function($scope, Authenticator, $routeParams) {
  var key = $routeParams.key;
  $scope.confirmed = false;
  $scope.failedReset = false;
  var promise = Authenticator.confirmEmail(key);
  promise.then(
    function() {
      $scope.confirmed = true;
    },
    function(message) {
      $scope.errorMessage = message;
    });
});

module.controller(
'DefaultController',
function($scope, user, $location, User, signUp, Messages, $modal, support) {
  $scope.support = support;
  if (user) {
    if (user.accountCreationStatus === 'choice') {
      $location.path('signup/choice');
    } else if (user.accountCreationStatus === 'personal') {
      $location.path('signup/personal');
    } else if (user.is_educator) {
      $location.path('matches');
    } else {

      $location.path('messages');
    }
  }

  var showModal = $location.search().showModal;

  $scope.newUser = new User();
  $scope.emailRegex = /.+@.+\..+/i;
  $scope.passwordMethods = {};
  $scope.pg = 'default';
  $scope.user_type = {value: ''};
  $scope.completeSplash = function() {
    $scope.newUser.name = $scope.newUser.firstName + ' ' + $scope.newUser.lastName;
    var userPromise = signUp($scope.newUser, $scope.newUser.password);
    userPromise.then(
      function() {
        $scope.errorMessage = '';
        if ($scope.user_type.value === 'communityPartner') {
          $location.path('/signup/communitypartner');
        } else if ($scope.user_type.value === 'educator') {
          $location.path('/signup/educator');
        } else {
          $location.path('signup/choice');
        }
      },
      function(message) {
        $scope.errorMessage = message;
      });
/*        if ($scope.user_type == 'communityPartner') {
      $scope.pg = 'partner1';
      $scope.isCommunityPartner = true;
    } else if ($scope.user_type == 'educator') {
      $scope.pg = 'educator1';
      $scope.isEducator = true;
    }*/
  };
  $scope.showTerms = function() {
    $modal.open({
      templateUrl: './static/templates/terms.html',
      controller: 'ModalController'
    });
  };
  $scope.showPrivacy = function() {
    $modal.open({
      templateUrl: './static/templates/privacy.html',
      controller: 'ModalController'
    });
  };

  $scope.showChoiceText = function() {
    $modal.open({
      templateUrl: './static/templates/choice_educator_modal.html',
      controller: 'ModalController'
    });
  };

  $scope.showEducatorText = function() {
    $modal.open({
      templateUrl: './static/templates/choice_educator_modal.html',
      controller: 'ModalController'
    });
  };

  $scope.showPartnerText = function() {
    $modal.open({
      templateUrl: './static/templates/choice_partner_modal.html',
      controller: 'ModalController'
    });
  };

  if (showModal == 'terms') {
    $scope.showTerms();
  }
  if (showModal == 'privacy') {
    $scope.showPrivacy();
  }
});

module.controller(
'AuthRedirectController',
function ($scope, Authenticator, Messages) {
  $scope.resendEmailConfirmation = function() {
    var emailConfirmPromise = Authenticator.requestConfirmEmail();
    emailConfirmPromise.then(
      function() {
        Messages.info('Sent email confirmation email.');
      },
      function(errorMessage) {
        Messages.error(errorMessage);
      });
  };
}
);

module.controller(
'LoginController',
function(Session, $scope, $location, Authenticator) {
  var nextLocation = $location.search().goto;
  $scope.email = {value: undefined};
  $scope.password = {value: undefined};
  $scope.errorMessage = '';

  $scope.login = function() {
    var userPromise = Authenticator.authenticateWithEmailAndPassword(
      $scope.email.value, $scope.password.value);
    userPromise.then(
      function() {

        if (!Session.activeUser.email_confirmed) {
          $location.path("/auth_redirect");
        } else {
          $location.search('goto', null);
          if (nextLocation) {
            $location.path(nextLocation);
          } else {
            $location.path("/");
          }
        }
      },
      function(message) {
        var msg = '';
        if (message) {
          msg = ': ' + message;
        }
        $scope.errorMessage = 'Authentication failed' + msg;
      }
    );
  };
});

