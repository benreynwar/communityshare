'use strict';

var angular = require( 'angular' );

var module = angular.module('communityshare.directives.labels', [
'communityshare.services.search'
]);

module.factory(
'makeBaseLabels',
function() {
  var makeBaseLabels = function() {
    var labels = {
      // Grade levels
      gradeLevels: {
        suggested: ['K-5', '6-8', '9-12', 'College', 'Adult'] ,
        other: ['K-3', '4-5', '6-8', '9-12', 'Preschool']
      },
      subjectAreas: {
        communityPartnerSuggested: [
          'Science', 'Technology', 'Engineering', 'Math',
          'Visual Arts', 'Digital Media', 'Wildlife Biology',
          'English/Literature', 'Performing Arts', 'History',
          'PE/Sports', 'Foreign Languages', 'Government',
          'Health', 'Journalism', 'Culinary Arts',
          'Entrepreneurship'
        ],
        educatorSuggested: [
          'Science', 'Technology', 'Engineering', 'Math',
          'Visual Arts', 'Digital Media', 'Wildlife Biology',
          'English/Literature', 'Performing Arts', 'History',
          'PE/Sports', 'Foreign Languages', 'Government',
          'Health', 'Journalism', 'Culinary Arts',
          'Entrepreneurship'
        ],
        other: []
      },
      // Level of Engagement
      engagementLevels: {
        suggested: [
          'Guest Speaker', 'Host Field Trip', 'Judge Student Competition',
          'Participate in Career Day', 'Collaborate on a Class Project',
          'Mentor Students', 'Brainstorm Curriculum Ideas with Educator',
          'Hands-On Demonstration'
        ],
        other: [
        ]
      }
    };

    var allLabels = {
      gradeLevels: labels.gradeLevels.suggested.concat(
        labels.gradeLevels.other),
      engagementLevels: labels.engagementLevels.suggested.concat(
        labels.engagementLevels.other),
      subjectAreas: labels.subjectAreas.communityPartnerSuggested.concat(
        labels.subjectAreas.educatorSuggested).concat(
          labels.subjectAreas.other)
    };
    var educatorSuggestedLabels = {
      gradeLevels: labels.gradeLevels.suggested,
      engagementLevels: labels.engagementLevels.suggested,
      subjectAreas: labels.subjectAreas.educatorSuggested
    };
    var communityPartnerSuggestedLabels = {
      gradeLevels: labels.gradeLevels.suggested,
      engagementLevels: labels.engagementLevels.suggested,
      subjectAreas: labels.subjectAreas.communityPartnerSuggested
    };
    var communityPartnerAndEducatorSuggestedLabels = {
      gradeLevels: labels.gradeLevels.suggested,
      engagementLevels: labels.engagementLevels.suggested,
      subjectAreas: labels.subjectAreas.communityPartnerSuggested.concat(
        labels.subjectAreas.educatorSuggested)
    };


    return {'educatorSuggested': educatorSuggestedLabels,
            'communityPartnerSuggested': communityPartnerSuggestedLabels,
            'communityPartnerAndEducatorSuggested': communityPartnerAndEducatorSuggestedLabels,
            'all': allLabels};
  };

  return makeBaseLabels;
});

module.factory(
'labelMapping',
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
'orderLabels',
function(labelMapping) {
  var orderLabels = function(labels) {
    var gradeLevels = [];
    var subjectAreas = [];
    var engagementLevels = [];
    for (var i=0; i<labels.length; i++) {
      var label = labels[i];
      if (labelMapping[label] === 'gradeLevels') {
        gradeLevels.push(label);
      } else if (labelMapping[label] == 'engagementLevels') {
        engagementLevels.push(label);
      } else {
        subjectAreas.push(label);
      }
    }
    var combinedLabels = gradeLevels.concat(subjectAreas).concat(engagementLevels);
    return combinedLabels;
  };
  return orderLabels;
});

module.factory(
'LabelDisplay',
function(makeBaseLabels, labelMapping) {
  var LabelDisplay = function(search, type) {
    this.search = search;
    var baseLabels = makeBaseLabels();
    this.all = {};
    this.active = {};
    if (type === 'educator') {
      this.all = baseLabels.educatorSuggested;
    } else {
      this.all = baseLabels.communityPartnerSuggested;
    }
    for (var i=0; i<search.labels.length; i++) {
      var label = search.labels[i];
      this.active[label] = true;
      var key = labelMapping[label];
      if (key === undefined) {
        key = 'subjectAreas';
        this.all[key].push(label);
      }
    }
  };
  LabelDisplay.prototype.setSelected = function(label) {
    this.active[label] = true;
    var index = this.search.labels.indexOf(label);
    if (index === -1) {
      this.search.labels.push(label);
    }
    this.search.dirty = true;
  };
  LabelDisplay.prototype.setUnselected = function(label) {
    this.active[label] = false;
    var index = this.search.labels.indexOf(label);
    if (index >= 0) {
      this.search.labels.splice(index, 1);
    }
    this.search.dirty = true;
  };
  LabelDisplay.prototype.toggle = function(label) {
    if (this.active[label]) {
      this.setUnselected(label);
    } else {
      this.setSelected(label);
    }
  };
  return LabelDisplay;
});

module.directive(
'csNewLabel',
 function() {
   return {
     scope: {
       methods: '='
     },
     controller: function($scope) {
       $scope.update = function() {
         if ($scope.methods.onUpdate) {
           $scope.methods.onUpdate();
         }
       };
     },
     link: function(scope, elm) {
       elm.bind('keydown', function(event) {
         var ENTERCODE = 13;
         var TABCODE = 9;
         if ((event.keyCode === ENTERCODE) || (event.keyCode === TABCODE)) {
           scope.$apply(scope.update);
         }
       });
     }
   };
 });

var LabelsController = function($scope, LabelDisplay, getAllLabels) {
// Problem with search getting overridden.
$scope.display = new LabelDisplay($scope.search, $scope.type);
$scope.newLabel = {
  name: ''
};
var labelsPromise = getAllLabels();
$scope.allLabels = [];
labelsPromise.then(
  function(labels) {
    $scope.allLabels = labels;
  },
  function(){});
$scope.typeaheadSelect = function() {
  $scope.newLabelMethods.onUpdate();
};
$scope.newLabelMethods = {
  onUpdate: function() {
    var splitNames
      , newLabelName
      , i
      , index
      ;

    splitNames = $scope.newLabel.name.split(',');
    for (i = 0; i < splitNames.length; i++) {
      newLabelName = splitNames[i].trim().toLowerCase();
      if (newLabelName) {
        index = $scope.display.all.subjectAreas.indexOf(newLabelName);
        if (index < 0) {
          $scope.display.all.subjectAreas.push(newLabelName);
        }
        $scope.display.setSelected(newLabelName);
      }
    }
    $scope.newLabel.name = '';
  }
};
$scope.toggleLabel = function(label) {
  if (!$scope.onlyShowActive) {
    $scope.display.toggle(label);
  }
};
};

/*
- list of labels.

- create directive whre you choose them (need titles, and suggested labels)

- create directive where you display them (need classification and ordering)

cs-choose-labels search titles suggestion-type

cs-display-labels search

*/


module.directive(
'csLabels',
function() {
  return {
    scope: {
      search: '=',
      gradeLevelsTitle: '@',
      engagementLevelsTitle: '@',
      subjectAreasTitle: '@',
      subjectAreasLabel: '@',
      type: '@',
      onlyShowActive: '@'
    },
    templateUrl: './static/templates/labels.html',
    controller: LabelsController
  };
});

