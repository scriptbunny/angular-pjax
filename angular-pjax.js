(function($) {

  var module = angular.module('xPJAX', []);

  var defaults = {
    links: 'a:not([data-remote]):not([data-behavior]):not([data-skip-pjax])',
    popstate: true
  };

  var configs = [];

  /**
   * @param {jQuery|Element|String} container
   * @returns {jQuery|null}
   */
  function getConfig(container) {
    var $container = $(container);

    if ($container.length === 0) {
      throw 'Unknown container: ' + container.toString();
    }

    var found = null;

    angular.forEach(configs, function(value) {
      var currentContainer = value.container;

      if (currentContainer.get(0) == $container.get(0)) {
        found = value;
      }
    });

    if (found === null) {
      console.log(container);
      throw 'Unknown container: ' + container.toString();
    }

    return found;
  }

  module.provider('pjax', function() {
    this.$get = function() {
      return {
        defaults: function(options) {
          if (options) {
            angular.extend(defaults, options);
          }
          return defaults;
        },
        containers: function() {
          var containers = [];
          angular.forEach(configs, function(value) {
            containers.push(value.container);
          });
          return containers;
        },
        navigateTo: function(container, url) {
          var config = getConfig(container);

          return $.pjax({
            url: url,
            container: config.container
          });
        },
        reload: function(container, options)
        {
          var config = getConfig(container);

          var settings = {};
          angular.extend(settings, config, options);

          return $.pjax.reload(settings.container, settings);
        },
        submit: function(container, event, options)
        {
          var config = getConfig(container);

          var settings = {};
          angular.extend(settings, config, options);

          return $.pjax.submit(event, settings.container, settings);
        }
      };
    };
  });

  module.directive('pjaxContainer', [
    '$rootScope',
    function($rootScope) {
      return {
        scope: true,
        controller: [
          '$rootScope', '$scope', '$window', '$compile', '$element', '$timeout',
          function($rootScope, $scope, $window, $compile, $element, $timeout) {
            var contentScope = $scope,
                parentScope = $scope.$parent;

            var $document = $($window.document);

            var config = angular.extend({}, defaults, {
              container: $($element)
            });

            configs.push(config);

            $element.attr('data-pjax-container', true);
            $document.pjax(config.links, config);

            $element.on('pjax:popstate', function(e) {
              if (!config.container.is(e.target)) {
                return;
              }

              if (!config.popstate) {
                window.history.replaceState(null, "", e.state.url)
                window.location.replace(e.state.url)
              }
            });

            $element.on('pjax:start', function(e) {
              if (!config.container.is(e.target)) {
                return;
              }

              $rootScope.contentLoading = true;
            });

            $element.on('pjax:beforeReplace', function(e) {
              if (!config.container.is(e.target)) {
                return;
              }

              $timeout(function() {
                if (contentScope) {
                  contentScope.$destroy();
                }
              })
            });

            $element.on('pjax:end', function(e) {
              if (!config.container.is(e.target)) {
                return;
              }

              $timeout(function() {
                contentScope = parentScope.$new(false, parentScope);
                $element.html($compile($element.html())(contentScope));
                $rootScope.contentLoading = false;
              })
            });
          }
        ]
      };
    }]
  );

}).call(this, jQuery);