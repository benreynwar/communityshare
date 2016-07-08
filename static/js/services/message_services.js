'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.services.message',
[
]);

module.factory(
'Messages',
function($log, $timeout) {
  var MESSAGETIME = 5000; //milliseconds

  var Message = function(text, type) {
    this.text = text;
    this.type = type;
  };

  var MessageHolder = function() {
    this.messages = [];
  };
  MessageHolder.prototype.error = function(errorText) {
    var _this = this;
    var newMessage = new Message(errorText, 'danger');
    this.messages.push(newMessage);
    $log.error(errorText);
    $timeout(function() {
      _this.removeMessage(newMessage);
    }, MESSAGETIME);
  };
  MessageHolder.prototype.info = function(messageText) {
    var newMessage = new Message(messageText, 'info');
    this.messages.push(newMessage);
    $log.info(messageText);
  };
  MessageHolder.prototype.removeMessage = function(message) {

    var index = this.messages.indexOf(message);
    if (index >= 0) {
      this.messages.splice(index, 1);
    }
  };

  return new MessageHolder();
});

