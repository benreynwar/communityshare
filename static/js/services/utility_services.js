'use strict';

var angular = require( 'angular' );

var module = angular.module('communityshare.services.utility', []);

module.factory('support', function() {
var isIE =  function(version, comparison) {
  var cc = 'IE';
  var b = document.createElement('B');
  var docElem = document.documentElement;
  var isIE;
  if(version){
    cc += ' ' + version;
    if(comparison){ cc = comparison + ' ' + cc; }
  }
  b.innerHTML = '<!--[if '+ cc +']><b id="iecctest"></b><![endif]-->';
  docElem.appendChild(b);
  isIE = !!document.getElementById('iecctest');
  docElem.removeChild(b);
  return isIE;
};
return {
  nativePlaceholderSupport: (function() {
    var i = document.createElement('input');
    return i.placeholder !== undefined;
  })(),
  isIE: isIE,
  fileUploader: !isIE(8, 'lte')
};
});


module.filter('truncate', function () {
return function (text, length, end) {
  if (end === undefined) {
    end = "...";
  }
  var output;
  if ((text.length <= length) || (text.length - end.length <= length)) {
    output = text;
  }
  else {
    output = String(text).substring(0, length-end.length) + end;
  }
  return output ;
};
});

module.factory('parseyyyyMMdd', function() {
return function(yyyyMMdd) {
  var date = new Date(yyyyMMdd.substring(0, 4), yyyyMMdd.substring(4, 6),
                      yyyyMMdd.substring(6, 8));
  date.setMonth(date.getMonth()-1);
  return date;
};
});

