'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.services.conversation',
[
  'communityshare.services.item',
  'communityshare.services.user',
  'communityshare.services.share'
]);

module.factory(
'conversationLoader',
function(Conversation, $q) {
  return function(conversationId) {
    var deferred = $q.defer();
    var conversationPromise = Conversation.get(conversationId);
    conversationPromise.then(
      function(conversation) {
        deferred.resolve(conversation);
      },
      function() {
        deferred.resolve(undefined);
      });
    return deferred.promise;
  };
});

module.factory(
'Conversation',
function(SessionBase, itemFactory, UserBase, Message, Messages, Share) {
  var Conversation = itemFactory('conversation');
  Conversation.prototype.toData = function() {
    var fields = ['id', 'title', 'search_id', 'userA_id', 'userB_id'];
    var d = {};
    for (var i=0; i<fields.length; i++) {
      var field = fields[i];
      d[field] = this[field];
    }
    return d;
  };
  Conversation.prototype.updateFromData = function(data) {
    var _this = this;
    for (var key in data) {
      this[key] = data[key];
    }
    if (this.userA) {
      this.userA = UserBase.make(this.userA);
    }
    if (this.userB) {
      this.userB = UserBase.make(this.userB);
    }
    SessionBase.getActiveUserPromise().then(
      function(activeUser) {
        if (activeUser) {
          if (activeUser.id === _this.userA_id) {
            _this.otherUser = _this.userB;
          } else if (activeUser.id === _this.userB_id) {
            _this.otherUser = _this.userA;
          }
        }
      });
    this.datetime_last_message = undefined;
    if (this.messages) {
      for (var i=0; i<this.messages.length; i++) {
        var messageData = this.messages[i];
        this.messages[i] = new Message(messageData);
        if (messageData.sender_user_id === this.userA.id) {
          this.messages[i].sender_user = this.userA;
        } else if (messageData.sender_user_id === this.userB.id) {
          this.messages[i].sender_user = this.userB;
        }
        if ((this.datetime_last_message === undefined) ||
            (this.messages[i].date_created > this.datetime_last_message)) {
          this.datetime_last_message = this.messages[i].date_created;
        }
      }
    }
  };
  Conversation.prototype.getUnviewedMessages = function() {
    var unviewedMessages = [];
    if (this.otherUser) {
      for (var i=0; i<this.messages.length; i++) {
        var message = this.messages[i];
        if ((message.sender_user_id === this.otherUser.id) &&
            !(message.viewed)) {
          unviewedMessages.push(message);
        }
      }
    }
    return unviewedMessages;
  };
  Conversation.prototype.markMessagesAsViewed = function() {
    var messages = this.getUnviewedMessages();
    for (var i=0; i<messages.length; i++) {
      var message = messages[i];
      message.viewed = true;
      message.save();
    }
  };
  Conversation.prototype.makeShare = function() {
    var share;
    if (this.otherUser) {
      var educator_user_id;
      var community_partner_user_id;
      if (SessionBase.activeUser.is_educator) {
        educator_user_id = SessionBase.activeUser.id;
      } else if (SessionBase.activeUser.is_community_partner) {
        community_partner_user_id = SessionBase.activeUser.id;
      }
      if (this.otherUser.is_educator) {
        educator_user_id = this.otherUser.id;
      } else if (this.otherUser.is_community_partner) {
        community_partner_user_id = this.otherUser.id;
      }
      if ((educator_user_id === undefined) || (community_partner_user_id === undefined)) {
        Messages.error('A share required both an educator and a community partner.');
      } else {
        share = new Share({
          conversation_id: this.id,
          educator_user_id: educator_user_id,
          community_partner_user_id: community_partner_user_id,
          title: undefined,
          description: undefined,
          educator_approved: false,
          community_partner_approved: false
        });
        share.addNewEvent();
      }
    }
    return share;
  };

  Conversation.getUnviewedForUser = function(user_id) {
    var data = {
      user_id: user_id,
      with_unviewed_messages: true
    };
    var conversationsPromise = Conversation.get_many(data=data);
    return conversationsPromise;
  };

  return Conversation;
});

module.factory(
'Message',
function(itemFactory) {
  var Message = itemFactory('message');
  Message.prototype.toData = function() {
    var fields = ['id', 'conversation_id', 'sender_user_id', 'content', 'date_created', 'user'];
    var d = {};
    for (var i=0; i<fields.length; i++) {
      var field = fields[i];
      d[field] = this[field];
    }
    return d;
  };
  Message.prototype.updateFromData = function(data) {
    for (var key in data) {
      this[key] = data[key];
    }
    if (this.date_created) {
      this.date_created = new Date(this.date_created);
    } else {
      this.date_created = new Date();
    }
  };
  return Message;
});

