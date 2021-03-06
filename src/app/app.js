(function () {
  'use strict';
  angular.module('@@appName', [
    'ngAnimate',
    'angular-loading-bar',
    'ngResource',
    'ngMaterial',
    'ui.router',
    'ngSanitize',
    'pascalprecht.translate',
    'uiGmapgoogle-maps'
  ]);

  angular.module('@@appName')
    .factory('httpInterceptor', ['$q', '$injector', 'conf', '$rootScope',
      function ($q, $injector, conf, $rootScope) {
        return {
          // Add authorization token to headers
          request: function (config) {
            if (config.url.indexOf(conf.API.BASEURL) === 0) {
              $rootScope.visibleLoading = true;
            }
            return config;
          },
          response: function (response) {
            if (response.config.url.indexOf(conf.API.BASEURL) === 0) {
              $rootScope.visibleLoading = false;
              if (response.data.status && response.data.status === 'ko') {
                $injector.get('$mdToast').showSimple('Error: ' + response.data.message);
                return $q.reject(response);
              }
            }
            return response;
          },
          responseError: function (response) {
            $rootScope.visibleLoading = false;
            if (response.status === 401) {
              $injector.get('$state').go('logout');
            }
            return $q.reject(response);
          }
        };
      }])
    .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$translateProvider', '$mdThemingProvider', '$resourceProvider', 'cfpLoadingBarProvider', 'uiGmapGoogleMapApiProvider', '$locationProvider',
      function ($stateProvider, $urlRouterProvider, $httpProvider, $translateProvider, $mdThemingProvider, $resourceProvider, cfpLoadingBarProvider, uiGmapGoogleMapApiProvider, $locationProvider) {
        cfpLoadingBarProvider.includeSpinner = false;
        $locationProvider.html5Mode(true);

        $urlRouterProvider.otherwise('/home');
        $stateProvider
          .state('root', {
            abstract: true,
            views: {
              'sidenav@': {
                templateUrl: 'app/main/nav/nav.html',
                controller: ['$scope', 'conf', function ($scope, conf) {
                  $scope.version = conf.VERSION;
                }]
              }
            },
            resolve: {
              translatePartialLoader: ['$translate', '$translatePartialLoader',
                function ($translate, $translatePartialLoader) {
                  $translatePartialLoader.addPart('app');
                  $translatePartialLoader.addPart('experience');
                  $translatePartialLoader.addPart('skill');
                  $translatePartialLoader.addPart('education');
                  $translatePartialLoader.addPart('interest');
                  return $translate.refresh();
                }]
            }
          })
          // Fake state just for redirection to what's considered as home
          .state('home', {
            url: '/home',
            onEnter: ['$state',
              function ($state) {
                $state.go('experience');
              }]
          });

        $httpProvider.interceptors.push('httpInterceptor');
        $resourceProvider.defaults.stripTrailingSlashes = false;
        $mdThemingProvider.theme('default')
          .primaryPalette('blue-grey')
          .accentPalette('indigo');

        // Initialize angular-translate
        $translateProvider.useLoader('$translatePartialLoader', {
          urlTemplate: 'i18n/{lang}/{part}.json'
        });
        $translateProvider.preferredLanguage('en');
        $translateProvider.useSanitizeValueStrategy('escaped');

        uiGmapGoogleMapApiProvider.configure({
          v: '3.30',
          key: 'AIzaSyALPF75dwSUZIWeAM-eBvMNA4BN3p-cCj4'
        });
      }])
    .run(['$rootScope', '$state', '$translate', '$mdSidenav', 'conf',
      function ($rootScope, $state, $translate, $mdSidenav, conf) {
        $rootScope.imgHost = conf.STATIC.BASEURL;

        $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams) {
          $rootScope.toState = toState;
          $rootScope.toStateParams = toStateParams;
        });

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
          var titleKey = 'global.title';

          $rootScope.previousStateName = fromState.name;
          $rootScope.previousStateParams = fromParams;

          // Set the page title key to the one configured in state or use default one
          if (toState.data.pageTitle) {
            titleKey = toState.data.pageTitle;
          }
          $translate(titleKey).then(function (title) {
            // Change window title with translated one
            $rootScope.title = title;
          });
        });

        $rootScope.back = function () {
          // If previous state is 'activate' or do not exist go to 'home'
          if ($rootScope.previousStateName === 'activate' || $state.get($rootScope.previousStateName) === null) {
            $state.go('home');
          } else {
            $state.go($rootScope.previousStateName, $rootScope.previousStateParams);
          }
        };

        $rootScope.toggleNav = function () {
          $mdSidenav('left').toggle();
        };
      }]);
})();
