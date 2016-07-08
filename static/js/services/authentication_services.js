'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.services.authentication',
[
  'ngResource',
  'communityshare.services.user',
  'communityshare.services.conversation'
]);

module.factory(
'activeUserLoader',
function(SessionBase) {
  return SessionBase.getActiveUserPromise;
});

module.factory(
'SessionBase',
function($q) {
  var SessionBase = {};
  var deferred;
  SessionBase.clearUser = function() {
    deferred = $q.defer();
    SessionBase.activeUser = undefined;
  };
  SessionBase.setUser = function(user) {
    deferred.resolve(user);
    SessionBase.activeUser = user;
    if (user) {
      user.updateUnviewedConversations();
    }
  };
  SessionBase.getActiveUserPromise = function() {
    return deferred.promise;
  };
  SessionBase.clearUser();
  return SessionBase;
});

module.factory(
'Session',
function(SessionBase, Authenticator) {
  Authenticator.authenticateFromCookie();
  return SessionBase;
});

module.factory(
'Authenticator',
function($q, $http, User, SessionBase, $cookies, $cookieStore) {
  var Authenticator = {};
  Authenticator.clean = function() {
    $http.defaults.headers.common.Authorization = '';
    $cookieStore.remove('apiKey');
    SessionBase.clearUser();
    SessionBase.setUser(undefined);
  };
  Authenticator.setApiKey = function(key) {
    $http.defaults.headers.common.Authorization =
      'Basic:api:' + key;
    $cookies.apiKey = key;
  };
  Authenticator.setEmail = function(email) {
    $cookies.email = email;
  };

  Authenticator.authenticateFromCookie =
    function() {
      var deferred = $q.defer();
      var apiKey = $cookies.apiKey;
      var email = $cookies.email;
      if ((apiKey) && (email)){
        Authenticator.setApiKey(apiKey);
        var userPromise = User.getByEmail(email);
        userPromise.then(
          function(user) {
            SessionBase.setUser(user);
          },
          function(message) {
            SessionBase.setUser(undefined);
            deferred.reject(message);
          }
        );
      } else {
        var message = 'No cookie found';
        SessionBase.setUser(undefined);
        deferred.reject(message);
      }
    };

  Authenticator.authenticateWithEmailAndPassword =
    function(email, password) {
      $http.defaults.headers.common.Authorization =
        'Basic:' + email + ':' + password;
      var url = '/api/requestapikey';
      var promiseApiKey = $http({
        url: url,
        method: 'GET'
      });
      promiseApiKey.then(
        function(response) {
          var apiKey = response.data.apiKey;
          Authenticator.setApiKey(apiKey);
          $cookies.email = email;
        },
        function(response) {
        });
      var userPromise = User.getByEmail(email);
      SessionBase.clearUser();
      userPromise.then(
        function(user) {
          SessionBase.setUser(user);
        },
        function(response) {
          SessionBase.setUser(undefined);
        }
      );
      return userPromise;
    };

  Authenticator.requestResetPassword = function(email) {
    var url = 'api/requestresetpassword/'+email;
    var deferred = $q.defer();
    var promise = $http({
      url: url,
      method: 'GET'
    });
    promise.then(
      function(response) {
        deferred.resolve(response.data);
      },
      function(response) {
        var message;
        if (response.data && response.data.message) {
          message = response.data.message;
        }
        deferred.reject(message);
      });
    return deferred.promise;
  };

  Authenticator.requestConfirmEmail = function() {
    var deferred = $q.defer();
    var url = 'api/requestconfirmemail';
    var promise = $http({
      url: url,
      method: 'GET'
    });
    promise.then(
      function(response) {
        deferred.resolve(undefined);
      },
      function(response) {
        var message = 'Failed to send email confirmation email';
        if (response.data && response.data.message) {
          message += ': ' + response.data.message;
        }
        response.reject(message);
      });
    return deferred.promise;
  };

  Authenticator.confirmEmail = function(key) {
    var deferred = $q.defer();
    var url = 'api/confirmemail';
    var promise = $http({
      url: url,
      method: 'POST',
      data: {
        key: key
      }
    });
    SessionBase.clearUser();
    promise.then(
      function(response) {
        var apiKey = response.data.apiKey;
        var user = new User(response.data.data);
        Authenticator.setApiKey(apiKey);
        SessionBase.setUser(user);
        deferred.resolve(user);
      },
      function(response) {
        var message = '';
        if (response.data && response.data.message) {
          message = response.data.message;
        }
        deferred.reject(message);
      });
    return deferred.promise;
  };

  Authenticator.resetPassword = function(key, password) {
    var deferred = $q.defer();
    var url = 'api/resetpassword';
    var promise = $http({
      url: url,
      method: 'POST',
      data: {
        key: key,
        password: password
      }
    });
    promise.then(
      function(response) {
        deferred.resolve(response.data);
      },
      function(response) {
        var message = '';
        if (response.data && response.data.message) {
          message = response.data.message;
        }
        deferred.reject(message);
      });
    return deferred.promise;
  };
  return Authenticator;
}
);

