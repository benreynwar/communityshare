'use strict';

var angular = require( 'angular' );

var module = angular.module(
'communityshare.services.survey',
[]);

module.factory(
'Answer',
function(itemFactory) {
  var Answer = itemFactory('answer');
  return Answer;
});

module.factory(
'Question',
function(itemFactory, $q, Answer) {
  var Question = itemFactory('question');
  Question.get_many_with_answers = function(
    user_id, searchParams, answerParams, forceRefresh) {
    var deferred = $q.defer();
    var questionsPromise = Question.get_many(searchParams, forceRefresh);
    // FIXME: Not scalable. Grabbing all answers for a given user.
    if (!answerParams) {
      answerParams = {};
    }
    answerParams.responder_id = user_id;
    var answersPromise = Answer.get_many(answerParams);
    $q.all([questionsPromise, answersPromise]).then(
      function(data) {
        var questions = data[0];
        var answers = data[1];
        var answersByQuestionId = {};
        for (var i=0; i<answers.length; i++) {
          var answer = answers[i];
          if (!(answer.question_id in answersByQuestionId)) {
            answersByQuestionId[answer.question_id] = [];
          }
          answersByQuestionId[answer.question_id].push(answer);
        }
        var sort_fn = function(a, b) {
            return a.created_date - b.created_date;
        };
        for (var j=0; j<questions.length; j++) {
          var question = questions[j];
          var some_answers = [];
          if (question.id in answersByQuestionId) {
            some_answers = answersByQuestionId[question.id];
          }
          some_answers.sort(sort_fn);
          if (some_answers.length > 0) {
            question.answer = some_answers[0];
            question.answers = some_answers;
          } else {
            question.answer = new Answer({question_id: question.id});
          }
        }
        deferred.resolve(questions);
      },
      function(message) {
        deferred.reject(message);
      }
    );
    return deferred.promise;
  };
  return Question;
});

