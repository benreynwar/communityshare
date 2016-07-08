'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.services.item',
[
  'ngResource',
  'ngCookies'
]);

module.factory(
'itemFactory',
function($q, $http, SessionBase) {
  var itemFactory = function(resourceName) {
    var Item = function(itemData) {
      this.updateFromData(itemData);
      if (this.initialize) {
        this.initialize();
      }
    };
    Item.cache = {};
    Item.searchCache = {};
    Item.prototype.toData = function() {
      var data = JSON.parse(JSON.stringify(this));
      return data;
    };
    Item.prototype.clone = function() {
      var data = this.toData();
      var item = new Item(data);
      return item;
    };
    Item.makeUrl = function(id) {
      var url = '/api/' + resourceName;
      if (id !== undefined) {
        url += '/' + id;
      }
      return url;
    };
    Item.make = function(itemData) {
      var item = Item.cache[itemData.id];
      if (item === undefined) {
        item = new Item(itemData);
        Item.cache[itemData.id] = item;
      } else {
        item.updateFromData(itemData);
      }
      return item;
    };

    Item.get = function(id, forceRefresh) {
      var deferred = $q.defer();
      var item = Item.cache[id];
      if ((item === undefined) || forceRefresh) {
        var dataPromise = $http({
          method: 'GET',
          url: Item.makeUrl(id)
        });
        dataPromise.then(
          function(data) {
            var item = Item.make(data.data.data);
            deferred.resolve(item);
          },
          function(response) {
            deferred.reject(response.message);
          }
        );
      } else {
        deferred.resolve(item);
      }
      return deferred.promise;
    };
    Item.get_many = function(searchParams, forceRefresh) {
      var deferred = $q.defer();

      var searchHash = JSON.stringify(searchParams);
      var items = Item.searchCache[searchHash];
      if ((items === undefined) || forceRefresh) {

        var dataPromise = $http({
          method: 'GET',
          url: Item.makeUrl(),
          params: searchParams
        });

        dataPromise.then(
          function(response) {
            var items = [];
            for (var i=0; i<response.data.data.length; i++) {
              var item = Item.make(response.data.data[i]);
              items.push(item);
            }
            Item.searchCache[searchHash] = items;
            deferred.resolve(items);
          },
          function(response) {
            deferred.reject(response.data.message);
          }
        );

      } else {
        deferred.resolve(items);
      }
      return deferred.promise;
    };
    Item.prototype._baseUpdateFromData = function(itemData) {
      for (var key in itemData) {
        this[key] = itemData[key];
      }
    };
    Item.prototype.updateFromData = function(itemData) {
      for (var key in itemData) {
        this[key] = itemData[key];
      }
    };
    Item.prototype.save = function() {
      var _this = this;
      var deferred = $q.defer();
      var method;
      if (this.id === undefined) {
        method = 'POST';
      } else {
        method = 'PUT';
      }
      var dataPromise = $http({
          method: method,
          url: Item.makeUrl(this.id),
          data: this.toData()
        });
      dataPromise.then(
        function(response) {
          _this.updateFromData(response.data.data);
          // Properties of the current user can also be set.
          if (response.data.user !== undefined) {
            SessionBase.activeUser.updateFromData(response.data.user);
          }
          deferred.resolve(_this);
        },
        function(response) {
          var message = '';
          if (response.data.message) {
            message = response.data.message;
          }
          deferred.reject(message);
        }
      );
      return deferred.promise;

    };
    Item.prototype.destroy = function() {
      var _this = this;
      var deferred = $q.defer();
      var dataPromise = $http({
          method: 'DELETE',
          url: Item.makeUrl(this.id)
        });
      dataPromise.then(
        function() {
          _this.active = false;
          Item.cache[_this.id] = undefined;
          // Remove the items from the cached searches.
          for (var searchHash in Item.searchCache) {
            var items = Item.searchCache[searchHash];
            var index = items.indexOf(_this);
            if (index >= 0) {
              items.splice(index, 1);
            }
          }
          deferred.resolve();
        },
        function(response) {
          var message = '';
          if (response.data.message) {
            message = response.data.message;
          }
          deferred.reject(message);
        }
      );
      return deferred.promise;
    };

    return Item;
  };
  return itemFactory;
});
