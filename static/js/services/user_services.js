'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.services.user',
[
  'communityshare.services.item',
  'communityshare.services.message'
]);

module.factory(
'signUp',
function($q, $http, User, Authenticator, Session, Messages) {
  var signUp = function(user, password) {
    var deferred = $q.defer();
    var dataPromise = $http({
      method: 'POST',
      url: '/api/usersignup',
      data: {
        'user': user.toData(),
        'password': password
      }});
    Session.clearUser();
    dataPromise.then(
      function(response) {
        var user = User.make(response.data.data);
        Authenticator.setApiKey(response.data.apiKey);
        Authenticator.setEmail(user.email);
        if (user.warningMessage) {
          Messages.error('Failed to send email to confirm address.');
        }
        Session.setUser(user);
        user.updateUnviewedConversations();
        deferred.resolve(user);
      },
      function(response) {
        Session.setUser(undefined);
        deferred.reject(response.data.message);
      }
    );
    return deferred.promise;
  };
  return signUp;
});

module.factory(
'UserBase',
function(itemFactory) {
  var UserBase = itemFactory('user');
  UserBase.prototype.toData = function() {
    this.cleanInstitutionAssociations();
    var data = JSON.parse(JSON.stringify(this));
    if (this.id) {
      data.educator_profile_search = this.educator_profile_search.toData();
      data.community_partner_profile_search = this.community_partner_profile_search.toData();
    } else {
      data.educator_profile_search = null;
      data.community_partner_profile_search = null;
    }
    return data;
  };
  return UserBase;
});

module.factory(
'userLoader',
function(User, $q) {
  return function(userId) {
    var deferred = $q.defer();
    var userPromise = User.get(userId);
    userPromise.then(
      function(user) {
        deferred.resolve(user);
      },
      function() {
        deferred.resolve(undefined);
      });
    return deferred.promise;
  };
});


module.factory(
'User',
function(UserBase, $q, $http, Search, Conversation, SessionBase, Evnt, Messages) {

  UserBase.search = function(searchParams) {
    var deferred = $q.defer();
    var dataPromise = $http({
      method: 'GET',
      url: '/api/usersearch',
      params: searchParams
    });
    dataPromise.then(
      function(response) {
        var users = [];
        for (var i=0; i<response.data.data.length; i++) {
          users.push(UserBase.make(response.data.data[i]));
        }
        deferred.resolve(users);
      },
      function(response) {
        deferred.reject(response.message);
      }
    );
    return deferred.promise;
  };

  UserBase.prototype.cleanInstitutionAssociations = function() {
    // Remove any insitutions with no names
    var filteredInstitutionAssociations = [];
    for (var i=0; i<this.institution_associations.length; i++) {
      var institution_association = this.institution_associations[i];
      if (institution_association.institution && institution_association.institution.name) {
        filteredInstitutionAssociations.push(institution_association);
      }
    }
    this.institution_associations = filteredInstitutionAssociations;
  };

  UserBase.prototype.addInstitutionAssociationRemoveMethod = function(ia) {
    var _this = this;
    ia.remove = function() {
      var index = _this.institution_associations.indexOf(ia);
      if (index > -1) {
        _this.institution_associations.splice(index, 1);
      }
    };
  };

  UserBase.prototype.updateFromData = function(data) {
    this._baseUpdateFromData(data);
    if (this.educator_profile_search) {
      this.educator_profile_search = new Search(
        this.educator_profile_search);
    } else {
      this.educator_profile_search = new Search({
        searcher_user_id: this.id,
        searcher_role: 'educator',
        searching_for_role: 'partner',
        zipcode: this.zipcode,
        labels: []
      });
    }
    if (this.community_partner_profile_search) {
      this.community_partner_profile_search = new Search(
        this.community_partner_profile_search);
    } else {
      this.community_partner_profile_search = new Search({
        searcher_user_id: this.id,
        searcher_role: 'partner',
        searching_for_role: 'educator',
        zipcode: this.zipcode,
        labels: []
      });
    }
    if (this.is_administrator) {
      this.accountCreationStatus = 'done';
    } else if ((this.educator_profile_search.labels.length === 0) &&
        (this.community_partner_profile_search.labels.length === 0)) {
      this.accountCreationStatus = 'choice';
    } else if (!this.bio) {
      this.accountCreationStatus = 'personal';
    } else {
      this.accountCreationStatus = 'done';
    }

    if (this.institution_associations === undefined)  {
      this.institution_associations = [];
      this.addNewInstitutionAssociation();
    } else {
      for (var i=0; i<this.institution_associations.length; i++) {
        var ia = this.institution_associations[i];
        this.addInstitutionAssociationRemoveMethod(ia);
      }
    }
  };

  UserBase.prototype.initialize = function() {
    var _this = this;
    if (SessionBase.activeUser) {
      var conversationsPromise = Conversation.get_many(
        {user_id: SessionBase.activeUser.id});
      conversationsPromise.then(
        function(conversations) {
          _this.conversationsWithMe = [];
          for (var i=0; i<conversations.length; i++) {
            var conversation = conversations[i];
            if (conversation.otherUser.id === _this.id) {
              _this.conversationsWithMe.push(conversation);
            }
          }
        });
    }
  };

  UserBase.prototype.addNewInstitutionAssociation = function() {
    var ia = {
      institution: {},
      role: ''
    };
    this.institution_associations.push(ia);
    this.addInstitutionAssociationRemoveMethod(ia);
  };

  UserBase.getByEmail = function(email) {
    var deferred = $q.defer();
    var dataPromise = $http({
      method: 'GET',
      url: '/api/userbyemail/' + email
    });
    dataPromise.then(
      function(data) {
        var user = UserBase.make(data.data.data);
        deferred.resolve(user);
      },
      function(response) {
        deferred.reject(response.message);
      }
    );
    return deferred.promise;
  };

  UserBase.prototype.getSearches = function() {
    var searchParams = {
      'searcher_user_id': this.id,
      'active': true
    };
    var searchesPromise = Search.get_many(searchParams);
    return searchesPromise;
  };

  UserBase.prototype.getRecentConversations = function() {
    var now = new Date();
    var oneMonthAgo = new Date(now.getFullYear(), now.getMonth()-1, now.getDate());
    var conversationParams = {
      user_id: this.id,
      'messages.date_created.greaterthan': oneMonthAgo
    };
    var conversationsPromise = Conversation.get_many(
      conversationParams, true);
    return conversationsPromise;
  };

  UserBase.prototype.getUpcomingEvents = function() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var params = {
      user_id: SessionBase.activeUser.id,
      'datetime_start.greaterthan': today
    };
    var eventsPromise = Evnt.get_many(params);
    return eventsPromise;
  };

  UserBase.prototype.updateUnviewedConversations = function() {
    var _this = this;
    var conversationsPromise = Conversation.getUnviewedForUser(this.id);
    conversationsPromise.then(
      function(conversations) {
        var nUnviewedMessages = 0;
        for (var i=0; i<conversations.length; i++) {
          var conversation = conversations[i];
          var messages = conversation.getUnviewedMessages();
          nUnviewedMessages += messages.length;
        }
        _this.nUnviewedMessages = nUnviewedMessages;
      },
      function(message) {
        var msg = '';
        if (message) {
          msg = ': ' + message;
        }
        Messages.error('Failed to get messages: ' + msg);
      });
  };

  return UserBase;
});

module.factory(
'Institution',
function(itemFactory) {
  var Institution = itemFactory('institution');
  return Institution;
});

// A function that bring up a modal to send a message to someone.
module.factory(
'startConversation',
function($modal, $location, Conversation, Messages) {
  var startConversation = function(thisUser, otherUser, search, directToConversation) {
    var userId = otherUser.id;
    var searchId;
    if (search) {
      searchId = search.id;
    }
    // See if we have a conversation with this user
    var conversationsPromise = Conversation.get_many(
      {user_id: thisUser.id,
       other_user_id: otherUser.id
      }, true);
    // Options for the new conversation modal.
    var newConversationOpts = {
      templateUrl: './static/templates/new_conversation.html',
      controller: 'NewConversationController',
      resolve: {
        userId: function() {return userId;},
        searchId: function() {return searchId;}
      }
    };
    var withNewConversation = function(conversation) {
      if (conversation && directToConversation) {
        $location.path('/conversation/' + conversation.id);
      }
    };
    conversationsPromise.then(
      function(conversations) {
        // If we have one conversation with that user go
        // directly to that page.
        if (conversations.length === 1) {
          $location.path('/conversation/' + conversations[0].id);
        }
        // If we have no conversations pop up the new converation
        // modal.
        else if (conversations.length === 0) {
          var m = $modal.open(newConversationOpts);
          m.result.then(withNewConversation);
        }
        // If we have more than one conversation (which shouldn't happen
        // with our current UI) we display a choose conversation modal.
        else {
          var opts = {
            templateUrl: './static/templates/choose_conversation.html',
            controller: function($scope) {
              $scope.conversations = conversations;
              //$scope.user = user;
              $scope.showConversation = function(conversation) {
                $location.path('/conversation/' + conversation.id);
              };
            }
          };
          $modal.open(opts);
        }
      },
      function(errorMessage) {
        Messages.info(errorMessage);
      }
    );
  };
  return startConversation;
});

