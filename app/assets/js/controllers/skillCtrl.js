(function() {
    'use strict';
    angular.module('Gairal.controllers')
      .controller('SkillCtrl', ['$scope', 'gairalAPIservice',function( $scope, gairalAPIservice) {
            $scope.categories = [];
            gairalAPIservice.getSkills($scope);
      }]);
})();