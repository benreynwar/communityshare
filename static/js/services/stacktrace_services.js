'use strict';
//http://www.bennadel.com/blog/2542-logging-client-side-errors-with-angularjs-and-stacktrace-js.htm

var angular = require( 'angular' );

var module = angular.module('communityshare.services.stacktrace', []);

module.factory(
'stacktraceService',
function () {
  return({ print: printStackTrace });
}
);

module.provider(
'$exceptionHandler', {
  $get: function (errorLogService) {
    return(errorLogService);
  }
}
);

module.factory(
'errorLogService',
function ($log, $window, stacktraceService) {
  function log (exception, cause) {
    $log.error.apply($log, arguments);
    try {
      var errorMessage = exception.toString();
      var stackTrace = stacktraceService.print({ e: exception });
      $.ajax({
        type: 'POST',
        url: 'http://localhost:3030/error-log',
        contentType: 'application/json',
        data: angular.toJson({
          errorUrl: $window.location.href,
          errorMessage: errorMessage,
          stackTrace: stackTrace,
          cause: ( cause || '' ),
          browser: navigator.userAgent
        })
      });
    }
    catch (loggingError) {
      $log.warn('Error logging failed');
      $log.log(loggingError);
    }
  }
  return(log);
}
);
