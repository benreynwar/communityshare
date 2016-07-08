'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.services.map',
[
]);

module.factory(
'locationFromAddress',
function($q) {
  var geocoder = new google.maps.Geocoder();
  var locationFromAddress = function(address) {
    var deferred = $q.defer();
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        deferred.resolve(results[0].geometry.location);
      } else {
        deferred.reject('Geocode was not successful for the following reason: ' + status);
      }
    });
    return deferred.promise;
  };
  return locationFromAddress;
});

module.factory(
'Map',
function($q, locationFromAddress) {

  var Map = function(elementId) {
    var element = document.getElementById(elementId);
    if (element) {
      //  Setup map
      var latlng = new google.maps.LatLng(32.223303, -110.970905);
      var mapOptions = {
        zoom: 10,
        center: latlng
      };
      this.map = new google.maps.Map(document.getElementById(elementId), mapOptions);
    }
  };

  Map.prototype.codeAddress = function(address) {
    var _this = this;
    var deferred = $q.defer();
    var locationPromise = locationFromAddress(address);
    locationPromise.then(
      function(location) {
        if (_this.map) {
          _this.map.setCenter(location);
          _this.map.setZoom(13);
        }
        deferred.resolve(location);
      },
      function(message) {
        deferred.reject(message);
      });
    return deferred.promise;
  };

  return Map;
});

