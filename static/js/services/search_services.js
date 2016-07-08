'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.services.search',
[
  'communityshare.services.item',
  'communityshare.services.user'
]);

module.factory(
'getAllLabels',
function($q, $http) {
  var getAllLabels = function() {
    var url = '/api/labels';
    var labelsPromise = $http({
      method: 'GET',
      url: url
    });
    var deferred = $q.defer();
    labelsPromise.then(
      function(response) {
        var labels = response.data.data;
        deferred.resolve(labels);
      },
      function(response) {
        var message = response.data.message;
        deferred.reject(message);
      });
    return deferred.promise;
  };
  return getAllLabels;
});

module.factory(
'LabelMapping',
function(makeBaseLabels) {
  var labellists = makeBaseLabels().all;
  var labelMapping = {};
  for (var key in labellists) {
    for (var i=0; i<labellists[key].length; i++) {
      var label = labellists[key][i];
      labelMapping[label] = key;
    }
  }
  return labelMapping;
});

module.factory(
'Search',
function(itemFactory, $q, $http, labelMapping, UserBase, orderLabels) {

  var compareLabels = function(targetLabels, retrievedLabels) {
    var matchingLabels = {};
    var missingLabels = [];
    var lcTargetLabels = [];
    for (var i=0; i<targetLabels.length; i++) {
      lcTargetLabels.push(targetLabels[i].toLowerCase());
    }
    var lcRetrievedLabels = [];
    for (var j=0; j<retrievedLabels.length; j++) {
      lcRetrievedLabels.push(retrievedLabels[j].toLowerCase());
    }
    for (var k=0; k<lcTargetLabels.length; k++) {
      var lcTargetLabel = lcTargetLabels[k];
      var index = lcRetrievedLabels.indexOf(lcTargetLabel);
      if (index === -1) {
        missingLabels.push(targetLabels[k]);
      }
      matchingLabels[targetLabels[k]] = (index >= 0);
      if (index !== -1) {
        matchingLabels[retrievedLabels[index]] = true;
      }
    }
    var comparison = {
      'matching': matchingLabels,
      'missing': missingLabels
    };
    return comparison;
  };

  var Search = itemFactory('search');
  Search.prototype.initialize = function() {
    if(this.searcher_user) {
      this.searcher_user = UserBase.make(this.searcher_user);
    }
  };
  Search.prototype.updateFromData = function(data) {
    for (var key in data) {
      this[key] = data[key];
    }
    if (this.created) {
      this.created = new Date(this.created);
    }
    if (this.labels) {
      this.labels = orderLabels(this.labels);
    }
  };
  Search.prototype.isProfile = function(user) {
    var isProfile = (
      (user.community_partner_profile_search.id === this.id) ||
        (user.educator_profile_search.id === this.id));
    return isProfile;
  };
  Search.getResults = function(searchId, page) {
    var deferred = $q.defer();
    if (typeof page === 'undefined') page = 0;
    var url = '/api/search/' + searchId + '/' + page + '/results';
    var resultsPromise = $http({
      method: 'GET',
      url: url
    });
    var searchPromise = Search.get(searchId);
    var searchAndResultsPromise = $q.all([searchPromise, resultsPromise]);
    searchAndResultsPromise.then(
      function(responses) {
        var baseSearch = responses[0];
        var resultsResponse = responses[1];
        var searches = [];
        for (var i=0; i<resultsResponse.data.data.length; i++) {
          var search = new Search(resultsResponse.data.data[i]);
          var comparison = compareLabels(baseSearch.labels, search.labels);
          search.matchingLabels = comparison.matching;
          search.missingLabels = comparison.missing;
          search.targetLabels = baseSearch.labels;
          searches.push(search);
        }
        deferred.resolve(searches);
      },
      function(response) {
        var msg = '';
        if (response.message) {
          msg = response.message;
        }
        deferred.reject('Error loading search results: ' + msg);
      });
    return deferred.promise;
  };
  return Search;
});
