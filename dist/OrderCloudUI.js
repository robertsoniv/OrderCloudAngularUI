/**
 * OrderCloudUI - v0.0.1 - 2015-05-28
 * https://github.com/robertsoniv/OrderCloudAngularUI
 *
 * Copyright (c) 2015 Four51, Inc.
 * Licensed MIT <https://raw.github.com/robertsoniv/OrderCloudAngularUI/master/LICENSE>
 */
/**
 * angular-ui-utils - Swiss-Army-Knife of AngularJS tools (with no external dependencies!)
 * @version v0.2.3 - 2015-03-30
 * @link http://angular-ui.github.com
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
angular.module('ui.alias', []).config(['$compileProvider', 'uiAliasConfig', function($compileProvider, uiAliasConfig){
  'use strict';

  uiAliasConfig = uiAliasConfig || {};
  angular.forEach(uiAliasConfig, function(config, alias){
    if (angular.isString(config)) {
      config = {
        replace: true,
        template: config
      };
    }
    $compileProvider.directive(alias, function(){
      return config;
    });
  });
}]);

/**
 * General-purpose Event binding. Bind any event not natively supported by Angular
 * Pass an object with keynames for events to ui-event
 * Allows $event object and $params object to be passed
 *
 * @example <input ui-event="{ focus : 'counter++', blur : 'someCallback()' }">
 * @example <input ui-event="{ myCustomEvent : 'myEventHandler($event, $params)'}">
 *
 * @param ui-event {string|object literal} The event to bind to as a string or a hash of events with their callbacks
 */
angular.module('ui.event',[]).directive('uiEvent', ['$parse',
  function ($parse) {
    'use strict';

    return function ($scope, elm, attrs) {
      var events = $scope.$eval(attrs.uiEvent);
      angular.forEach(events, function (uiEvent, eventName) {
        var fn = $parse(uiEvent);
        elm.bind(eventName, function (evt) {
          var params = Array.prototype.slice.call(arguments);
          //Take out first paramater (event object);
          params = params.splice(1);
          fn($scope, {$event: evt, $params: params});
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        });
      });
    };
  }]);

/**
 * A replacement utility for internationalization very similar to sprintf.
 *
 * @param replace {mixed} The tokens to replace depends on type
 *  string: all instances of $0 will be replaced
 *  array: each instance of $0, $1, $2 etc. will be placed with each array item in corresponding order
 *  object: all attributes will be iterated through, with :key being replaced with its corresponding value
 * @return string
 *
 * @example: 'Hello :name, how are you :day'.format({ name:'John', day:'Today' })
 * @example: 'Records $0 to $1 out of $2 total'.format(['10', '20', '3000'])
 * @example: '$0 agrees to all mentions $0 makes in the event that $0 hits a tree while $0 is driving drunk'.format('Bob')
 */
angular.module('ui.format',[]).filter('format', function(){
  'use strict';

  return function(value, replace) {
    var target = value;
    if (angular.isString(target) && replace !== undefined) {
      if (!angular.isArray(replace) && !angular.isObject(replace)) {
        replace = [replace];
      }
      if (angular.isArray(replace)) {
        var rlen = replace.length;
        var rfx = function (str, i) {
          i = parseInt(i, 10);
          return (i >= 0 && i < rlen) ? replace[i] : str;
        };
        target = target.replace(/\$([0-9]+)/g, rfx);
      }
      else {
        angular.forEach(replace, function(value, key){
          target = target.split(':' + key).join(value);
        });
      }
    }
    return target;
  };
});

/**
 * Wraps the
 * @param text {string} haystack to search through
 * @param search {string} needle to search for
 * @param [caseSensitive] {boolean} optional boolean to use case-sensitive searching
 */
angular.module('ui.highlight',[]).filter('highlight', function () {
  'use strict';

  return function (text, search, caseSensitive) {
    if (text && (search || angular.isNumber(search))) {
      text = text.toString();
      search = search.toString();
      if (caseSensitive) {
        return text.split(search).join('<span class="ui-match">' + search + '</span>');
      } else {
        return text.replace(new RegExp(search, 'gi'), '<span class="ui-match">$&</span>');
      }
    } else {
      return text;
    }
  };
});

// modeled after: angular-1.0.7/src/ng/directive/ngInclude.js
angular.module('ui.include',[])
.directive('uiInclude', ['$http', '$templateCache', '$anchorScroll', '$compile',
                 function($http,   $templateCache,   $anchorScroll,   $compile) {
  'use strict';

  return {
    restrict: 'ECA',
    terminal: true,
    compile: function(element, attr) {
      var srcExp = attr.uiInclude || attr.src,
          fragExp = attr.fragment || '',
          onloadExp = attr.onload || '',
          autoScrollExp = attr.autoscroll;

      return function(scope, element) {
        var changeCounter = 0,
            childScope;

        var clearContent = function() {
          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }

          element.html('');
        };

        function ngIncludeWatchAction() {
          var thisChangeId = ++changeCounter;
          var src = scope.$eval(srcExp);
          var fragment = scope.$eval(fragExp);

          if (src) {
            $http.get(src, {cache: $templateCache}).success(function(response) {
              if (thisChangeId !== changeCounter) { return; }

              if (childScope) { childScope.$destroy(); }
              childScope = scope.$new();

              var contents;
              if (fragment) {
                contents = angular.element('<div/>').html(response).find(fragment);
              }
              else {
                contents = angular.element('<div/>').html(response).contents();
              }
              element.html(contents);
              $compile(contents)(childScope);

              if (angular.isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                $anchorScroll();
              }

              childScope.$emit('$includeContentLoaded');
              scope.$eval(onloadExp);
            }).error(function() {
              if (thisChangeId === changeCounter) { clearContent(); }
            });
          } else { clearContent(); }
        }

        scope.$watch(fragExp, ngIncludeWatchAction);
        scope.$watch(srcExp, ngIncludeWatchAction);
      };
    }
  };
}]);

/**
 * Provides an easy way to toggle a checkboxes indeterminate property
 *
 * @example <input type="checkbox" ui-indeterminate="isUnkown">
 */
angular.module('ui.indeterminate',[]).directive('uiIndeterminate', [
  function () {
    'use strict';

    return {
      compile: function(tElm, tAttrs) {
        if (!tAttrs.type || tAttrs.type.toLowerCase() !== 'checkbox') {
          return angular.noop;
        }

        return function ($scope, elm, attrs) {
          $scope.$watch(attrs.uiIndeterminate, function(newVal) {
            elm[0].indeterminate = !!newVal;
          });
        };
      }
    };
  }]);

/**
 * Converts variable-esque naming conventions to something presentational, capitalized words separated by space.
 * @param {String} value The value to be parsed and prettified.
 * @param {String} [inflector] The inflector to use. Default: humanize.
 * @return {String}
 * @example {{ 'Here Is my_phoneNumber' | inflector:'humanize' }} => Here Is My Phone Number
 *          {{ 'Here Is my_phoneNumber' | inflector:'underscore' }} => here_is_my_phone_number
 *          {{ 'Here Is my_phoneNumber' | inflector:'variable' }} => hereIsMyPhoneNumber
 */
angular.module('ui.inflector',[]).filter('inflector', function () {
  'use strict';

  function tokenize(text) {
    text = text.replace(/([A-Z])|([\-|\_])/g, function(_, $1) { return ' ' + ($1 || ''); });
    return text.replace(/\s\s+/g, ' ').trim().toLowerCase().split(' ');
  }

  function capitalizeTokens(tokens) {
    var result = [];
    angular.forEach(tokens, function(token) {
      result.push(token.charAt(0).toUpperCase() + token.substr(1));
    });
    return result;
  }

  var inflectors = {
    humanize: function (value) {
      return capitalizeTokens(tokenize(value)).join(' ');
    },
    underscore: function (value) {
      return tokenize(value).join('_');
    },
    variable: function (value) {
      value = tokenize(value);
      value = value[0] + capitalizeTokens(value.slice(1)).join('');
      return value;
    }
  };

  return function (text, inflector) {
    if (inflector !== false && angular.isString(text)) {
      inflector = inflector || 'humanize';
      return inflectors[inflector](text);
    } else {
      return text;
    }
  };
});

/**
 * General-purpose jQuery wrapper. Simply pass the plugin name as the expression.
 *
 * It is possible to specify a default set of parameters for each jQuery plugin.
 * Under the jq key, namespace each plugin by that which will be passed to ui-jq.
 * Unfortunately, at this time you can only pre-define the first parameter.
 * @example { jq : { datepicker : { showOn:'click' } } }
 *
 * @param ui-jq {string} The $elm.[pluginName]() to call.
 * @param [ui-options] {mixed} Expression to be evaluated and passed as options to the function
 *     Multiple parameters can be separated by commas
 * @param [ui-refresh] {expression} Watch expression and refire plugin on changes
 *
 * @example <input ui-jq="datepicker" ui-options="{showOn:'click'},secondParameter,thirdParameter" ui-refresh="iChange">
 */
angular.module('ui.jq',[]).
  value('uiJqConfig',{}).
  directive('uiJq', ['uiJqConfig', '$timeout', function uiJqInjectingFunction(uiJqConfig, $timeout) {
  'use strict';


  return {
    restrict: 'A',
    compile: function uiJqCompilingFunction(tElm, tAttrs) {

      if (!angular.isFunction(tElm[tAttrs.uiJq])) {
        throw new Error('ui-jq: The "' + tAttrs.uiJq + '" function does not exist');
      }
      var options = uiJqConfig && uiJqConfig[tAttrs.uiJq];

      return function uiJqLinkingFunction(scope, elm, attrs) {

        // If change compatibility is enabled, the form input's "change" event will trigger an "input" event
        if (attrs.ngModel && elm.is('select,input,textarea')) {
          elm.bind('change', function() {
            elm.trigger('input');
          });
        }

        function createLinkOptions(){
          var linkOptions = [];

          // If ui-options are passed, merge (or override) them onto global defaults and pass to the jQuery method
          if (attrs.uiOptions) {
            linkOptions = scope.$eval('[' + attrs.uiOptions + ']');
            if (angular.isObject(options) && angular.isObject(linkOptions[0])) {
              linkOptions[0] = angular.extend({}, options, linkOptions[0]);
            }
          } else if (options) {
            linkOptions = [options];
          }
          return linkOptions;
        }

        // Call jQuery method and pass relevant options
        function callPlugin() {
          $timeout(function() {
            elm[attrs.uiJq].apply(elm, createLinkOptions());
          }, 0, false);
        }

        // If ui-refresh is used, re-fire the the method upon every change
        if (attrs.uiRefresh) {
          scope.$watch(attrs.uiRefresh, function() {
            callPlugin();
          });
        }
        callPlugin();
      };
    }
  };
}]);

angular.module('ui.keypress',[]).
factory('keypressHelper', ['$parse', function keypress($parse){
  'use strict';

  var keysByCode = {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    27: 'esc',
    32: 'space',
    33: 'pageup',
    34: 'pagedown',
    35: 'end',
    36: 'home',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    45: 'insert',
    46: 'delete'
  };

  var capitaliseFirstLetter = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return function(mode, scope, elm, attrs) {
    var params, combinations = [];
    params = scope.$eval(attrs['ui'+capitaliseFirstLetter(mode)]);

    // Prepare combinations for simple checking
    angular.forEach(params, function (v, k) {
      var combination, expression;
      expression = $parse(v);

      angular.forEach(k.split(' '), function(variation) {
        combination = {
          expression: expression,
          keys: {}
        };
        angular.forEach(variation.split('-'), function (value) {
          combination.keys[value] = true;
        });
        combinations.push(combination);
      });
    });

    // Check only matching of pressed keys one of the conditions
    elm.bind(mode, function (event) {
      // No need to do that inside the cycle
      var metaPressed = !!(event.metaKey && !event.ctrlKey);
      var altPressed = !!event.altKey;
      var ctrlPressed = !!event.ctrlKey;
      var shiftPressed = !!event.shiftKey;
      var keyCode = event.keyCode;

      // normalize keycodes
      if (mode === 'keypress' && !shiftPressed && keyCode >= 97 && keyCode <= 122) {
        keyCode = keyCode - 32;
      }

      // Iterate over prepared combinations
      angular.forEach(combinations, function (combination) {

        var mainKeyPressed = combination.keys[keysByCode[keyCode]] || combination.keys[keyCode.toString()];

        var metaRequired = !!combination.keys.meta;
        var altRequired = !!combination.keys.alt;
        var ctrlRequired = !!combination.keys.ctrl;
        var shiftRequired = !!combination.keys.shift;

        if (
          mainKeyPressed &&
          ( metaRequired === metaPressed ) &&
          ( altRequired === altPressed ) &&
          ( ctrlRequired === ctrlPressed ) &&
          ( shiftRequired === shiftPressed )
        ) {
          // Run the function
          scope.$apply(function () {
            combination.expression(scope, { '$event': event });
          });
        }
      });
    });
  };
}]);

/**
 * Bind one or more handlers to particular keys or their combination
 * @param hash {mixed} keyBindings Can be an object or string where keybinding expression of keys or keys combinations and AngularJS Exspressions are set. Object syntax: "{ keys1: expression1 [, keys2: expression2 [ , ... ]]}". String syntax: ""expression1 on keys1 [ and expression2 on keys2 [ and ... ]]"". Expression is an AngularJS Expression, and key(s) are dash-separated combinations of keys and modifiers (one or many, if any. Order does not matter). Supported modifiers are 'ctrl', 'shift', 'alt' and key can be used either via its keyCode (13 for Return) or name. Named keys are 'backspace', 'tab', 'enter', 'esc', 'space', 'pageup', 'pagedown', 'end', 'home', 'left', 'up', 'right', 'down', 'insert', 'delete'.
 * @example <input ui-keypress="{enter:'x = 1', 'ctrl-shift-space':'foo()', 'shift-13':'bar()'}" /> <input ui-keypress="foo = 2 on ctrl-13 and bar('hello') on shift-esc" />
 **/
angular.module('ui.keypress').directive('uiKeydown', ['keypressHelper', function(keypressHelper){
  'use strict';

  return {
    link: function (scope, elm, attrs) {
      keypressHelper('keydown', scope, elm, attrs);
    }
  };
}]);

angular.module('ui.keypress').directive('uiKeypress', ['keypressHelper', function(keypressHelper){
  'use strict';

  return {
    link: function (scope, elm, attrs) {
      keypressHelper('keypress', scope, elm, attrs);
    }
  };
}]);

angular.module('ui.keypress').directive('uiKeyup', ['keypressHelper', function(keypressHelper){
  'use strict';

  return {
    link: function (scope, elm, attrs) {
      keypressHelper('keyup', scope, elm, attrs);
    }
  };
}]);

/*
 Attaches input mask onto input element
 */
angular.module('ui.mask', [])
  .value('uiMaskConfig', {
    'maskDefinitions': {
      '9': /\d/,
      'A': /[a-zA-Z]/,
      '*': /[a-zA-Z0-9]/
    },
    'clearOnBlur': true
  })
  .directive('uiMask', ['uiMaskConfig', '$parse', function (maskConfig, $parse) {
    'use strict';

    return {
      priority: 100,
      require: 'ngModel',
      restrict: 'A',
      compile: function uiMaskCompilingFunction(){
        var options = maskConfig;

        return function uiMaskLinkingFunction(scope, iElement, iAttrs, controller){
          var maskProcessed = false, eventsBound = false,
            maskCaretMap, maskPatterns, maskPlaceholder, maskComponents,
          // Minimum required length of the value to be considered valid
            minRequiredLength,
            value, valueMasked, isValid,
          // Vars for initializing/uninitializing
            originalPlaceholder = iAttrs.placeholder,
            originalMaxlength = iAttrs.maxlength,
          // Vars used exclusively in eventHandler()
            oldValue, oldValueUnmasked, oldCaretPosition, oldSelectionLength;

          function initialize(maskAttr){
            if (!angular.isDefined(maskAttr)) {
              return uninitialize();
            }
            processRawMask(maskAttr);
            if (!maskProcessed) {
              return uninitialize();
            }
            initializeElement();
            bindEventListeners();
            return true;
          }

          function initPlaceholder(placeholderAttr) {
            if(! angular.isDefined(placeholderAttr)) {
              return;
            }

            maskPlaceholder = placeholderAttr;

            // If the mask is processed, then we need to update the value
            if (maskProcessed) {
              eventHandler();
            }
          }

          function formatter(fromModelValue){
            if (!maskProcessed) {
              return fromModelValue;
            }
            value = unmaskValue(fromModelValue || '');
            isValid = validateValue(value);
            controller.$setValidity('mask', isValid);
            return isValid && value.length ? maskValue(value) : undefined;
          }

          function parser(fromViewValue){
            if (!maskProcessed) {
              return fromViewValue;
            }
            value = unmaskValue(fromViewValue || '');
            isValid = validateValue(value);
            // We have to set viewValue manually as the reformatting of the input
            // value performed by eventHandler() doesn't happen until after
            // this parser is called, which causes what the user sees in the input
            // to be out-of-sync with what the controller's $viewValue is set to.
            controller.$viewValue = value.length ? maskValue(value) : '';
            controller.$setValidity('mask', isValid);
            if (value === '' && iAttrs.required) {
                controller.$setValidity('required', !controller.$error.required);
            }
            return isValid ? value : undefined;
          }

          var linkOptions = {};

          if (iAttrs.uiOptions) {
            linkOptions = scope.$eval('[' + iAttrs.uiOptions + ']');
            if (angular.isObject(linkOptions[0])) {
              // we can't use angular.copy nor angular.extend, they lack the power to do a deep merge
              linkOptions = (function(original, current){
                for(var i in original) {
                  if (Object.prototype.hasOwnProperty.call(original, i)) {
                    if (current[i] === undefined) {
                      current[i] = angular.copy(original[i]);
                    } else {
                      angular.extend(current[i], original[i]);
                    }
                  }
                }
                return current;
              })(options, linkOptions[0]);
            }
          } else {
            linkOptions = options;
          }

          iAttrs.$observe('uiMask', initialize);
          iAttrs.$observe('placeholder', initPlaceholder);
          var modelViewValue = false;
          iAttrs.$observe('modelViewValue', function(val) {
            if(val === 'true') {
              modelViewValue = true;
            }
          });
          scope.$watch(iAttrs.ngModel, function(val) {
            if(modelViewValue && val) {
              var model = $parse(iAttrs.ngModel);
              model.assign(scope, controller.$viewValue);
            }
          });
          controller.$formatters.push(formatter);
          controller.$parsers.push(parser);

          function uninitialize(){
            maskProcessed = false;
            unbindEventListeners();

            if (angular.isDefined(originalPlaceholder)) {
              iElement.attr('placeholder', originalPlaceholder);
            } else {
              iElement.removeAttr('placeholder');
            }

            if (angular.isDefined(originalMaxlength)) {
              iElement.attr('maxlength', originalMaxlength);
            } else {
              iElement.removeAttr('maxlength');
            }

            iElement.val(controller.$modelValue);
            controller.$viewValue = controller.$modelValue;
            return false;
          }

          function initializeElement(){
            value = oldValueUnmasked = unmaskValue(controller.$viewValue || '');
            valueMasked = oldValue = maskValue(value);
            isValid = validateValue(value);
            var viewValue = isValid && value.length ? valueMasked : '';
            if (iAttrs.maxlength) { // Double maxlength to allow pasting new val at end of mask
              iElement.attr('maxlength', maskCaretMap[maskCaretMap.length - 1] * 2);
            }
            iElement.attr('placeholder', maskPlaceholder);
            iElement.val(viewValue);
            controller.$viewValue = viewValue;
            // Not using $setViewValue so we don't clobber the model value and dirty the form
            // without any kind of user interaction.
          }

          function bindEventListeners(){
            if (eventsBound) {
              return;
            }
            iElement.bind('blur', blurHandler);
            iElement.bind('mousedown mouseup', mouseDownUpHandler);
            iElement.bind('input keyup click focus', eventHandler);
            eventsBound = true;
          }

          function unbindEventListeners(){
            if (!eventsBound) {
              return;
            }
            iElement.unbind('blur', blurHandler);
            iElement.unbind('mousedown', mouseDownUpHandler);
            iElement.unbind('mouseup', mouseDownUpHandler);
            iElement.unbind('input', eventHandler);
            iElement.unbind('keyup', eventHandler);
            iElement.unbind('click', eventHandler);
            iElement.unbind('focus', eventHandler);
            eventsBound = false;
          }

          function validateValue(value){
            // Zero-length value validity is ngRequired's determination
            return value.length ? value.length >= minRequiredLength : true;
          }

          function unmaskValue(value){
            var valueUnmasked = '',
              maskPatternsCopy = maskPatterns.slice();
            // Preprocess by stripping mask components from value
            value = value.toString();
            angular.forEach(maskComponents, function (component){
              value = value.replace(component, '');
            });
            angular.forEach(value.split(''), function (chr){
              if (maskPatternsCopy.length && maskPatternsCopy[0].test(chr)) {
                valueUnmasked += chr;
                maskPatternsCopy.shift();
              }
            });
            return valueUnmasked;
          }

          function maskValue(unmaskedValue){
            var valueMasked = '',
                maskCaretMapCopy = maskCaretMap.slice();

            angular.forEach(maskPlaceholder.split(''), function (chr, i){
              if (unmaskedValue.length && i === maskCaretMapCopy[0]) {
                valueMasked  += unmaskedValue.charAt(0) || '_';
                unmaskedValue = unmaskedValue.substr(1);
                maskCaretMapCopy.shift();
              }
              else {
                valueMasked += chr;
              }
            });
            return valueMasked;
          }

          function getPlaceholderChar(i) {
            var placeholder = iAttrs.placeholder;

            if (typeof placeholder !== 'undefined' && placeholder[i]) {
              return placeholder[i];
            } else {
              return '_';
            }
          }

          // Generate array of mask components that will be stripped from a masked value
          // before processing to prevent mask components from being added to the unmasked value.
          // E.g., a mask pattern of '+7 9999' won't have the 7 bleed into the unmasked value.
          // If a maskable char is followed by a mask char and has a mask
          // char behind it, we'll split it into it's own component so if
          // a user is aggressively deleting in the input and a char ahead
          // of the maskable char gets deleted, we'll still be able to strip
          // it in the unmaskValue() preprocessing.
          function getMaskComponents() {
            return maskPlaceholder.replace(/[_]+/g, '_').replace(/([^_]+)([a-zA-Z0-9])([^_])/g, '$1$2_$3').split('_');
          }

          function processRawMask(mask){
            var characterCount = 0;

            maskCaretMap    = [];
            maskPatterns    = [];
            maskPlaceholder = '';

            if (typeof mask === 'string') {
              minRequiredLength = 0;

              var isOptional = false,
                  numberOfOptionalCharacters = 0,
                  splitMask  = mask.split('');

              angular.forEach(splitMask, function (chr, i){
                if (linkOptions.maskDefinitions[chr]) {

                  maskCaretMap.push(characterCount);

                  maskPlaceholder += getPlaceholderChar(i - numberOfOptionalCharacters);
                  maskPatterns.push(linkOptions.maskDefinitions[chr]);

                  characterCount++;
                  if (!isOptional) {
                    minRequiredLength++;
                  }
                }
                else if (chr === '?') {
                  isOptional = true;
                  numberOfOptionalCharacters++;
                }
                else {
                  maskPlaceholder += chr;
                  characterCount++;
                }
              });
            }
            // Caret position immediately following last position is valid.
            maskCaretMap.push(maskCaretMap.slice().pop() + 1);

            maskComponents = getMaskComponents();
            maskProcessed  = maskCaretMap.length > 1 ? true : false;
          }

          function blurHandler(){
            if (linkOptions.clearOnBlur) {
              oldCaretPosition = 0;
              oldSelectionLength = 0;
              if (!isValid || value.length === 0) {
                valueMasked = '';
                iElement.val('');
                scope.$apply(function () {
                  controller.$setViewValue('');
                });
              }
            }
          }

          function mouseDownUpHandler(e){
            if (e.type === 'mousedown') {
              iElement.bind('mouseout', mouseoutHandler);
            } else {
              iElement.unbind('mouseout', mouseoutHandler);
            }
          }

          iElement.bind('mousedown mouseup', mouseDownUpHandler);

          function mouseoutHandler(){
            /*jshint validthis: true */
            oldSelectionLength = getSelectionLength(this);
            iElement.unbind('mouseout', mouseoutHandler);
          }

          function eventHandler(e){
            /*jshint validthis: true */
            e = e || {};
            // Allows more efficient minification
            var eventWhich = e.which,
              eventType = e.type;

            // Prevent shift and ctrl from mucking with old values
            if (eventWhich === 16 || eventWhich === 91) { return;}

            var val = iElement.val(),
              valOld = oldValue,
              valMasked,
              valUnmasked = unmaskValue(val),
              valUnmaskedOld = oldValueUnmasked,
              valAltered = false,

              caretPos = getCaretPosition(this) || 0,
              caretPosOld = oldCaretPosition || 0,
              caretPosDelta = caretPos - caretPosOld,
              caretPosMin = maskCaretMap[0],
              caretPosMax = maskCaretMap[valUnmasked.length] || maskCaretMap.slice().shift(),

              selectionLenOld = oldSelectionLength || 0,
              isSelected = getSelectionLength(this) > 0,
              wasSelected = selectionLenOld > 0,

            // Case: Typing a character to overwrite a selection
              isAddition = (val.length > valOld.length) || (selectionLenOld && val.length > valOld.length - selectionLenOld),
            // Case: Delete and backspace behave identically on a selection
              isDeletion = (val.length < valOld.length) || (selectionLenOld && val.length === valOld.length - selectionLenOld),
              isSelection = (eventWhich >= 37 && eventWhich <= 40) && e.shiftKey, // Arrow key codes

              isKeyLeftArrow = eventWhich === 37,
            // Necessary due to "input" event not providing a key code
              isKeyBackspace = eventWhich === 8 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === -1)),
              isKeyDelete = eventWhich === 46 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === 0 ) && !wasSelected),

            // Handles cases where caret is moved and placed in front of invalid maskCaretMap position. Logic below
            // ensures that, on click or leftward caret placement, caret is moved leftward until directly right of
            // non-mask character. Also applied to click since users are (arguably) more likely to backspace
            // a character when clicking within a filled input.
              caretBumpBack = (isKeyLeftArrow || isKeyBackspace || eventType === 'click') && caretPos > caretPosMin;

            oldSelectionLength = getSelectionLength(this);

            // These events don't require any action
            if (isSelection || (isSelected && (eventType === 'click' || eventType === 'keyup'))) {
              return;
            }

            // Value Handling
            // ==============

            // User attempted to delete but raw value was unaffected--correct this grievous offense
            if ((eventType === 'input') && isDeletion && !wasSelected && valUnmasked === valUnmaskedOld) {
              while (isKeyBackspace && caretPos > caretPosMin && !isValidCaretPosition(caretPos)) {
                caretPos--;
              }
              while (isKeyDelete && caretPos < caretPosMax && maskCaretMap.indexOf(caretPos) === -1) {
                caretPos++;
              }
              var charIndex = maskCaretMap.indexOf(caretPos);
              // Strip out non-mask character that user would have deleted if mask hadn't been in the way.
              valUnmasked = valUnmasked.substring(0, charIndex) + valUnmasked.substring(charIndex + 1);
              valAltered = true;
            }

            // Update values
            valMasked = maskValue(valUnmasked);

            oldValue = valMasked;
            oldValueUnmasked = valUnmasked;
            iElement.val(valMasked);
            if (valAltered) {
              // We've altered the raw value after it's been $digest'ed, we need to $apply the new value.
              scope.$apply(function (){
                controller.$setViewValue(valUnmasked);
              });
            }

            // Caret Repositioning
            // ===================

            // Ensure that typing always places caret ahead of typed character in cases where the first char of
            // the input is a mask char and the caret is placed at the 0 position.
            if (isAddition && (caretPos <= caretPosMin)) {
              caretPos = caretPosMin + 1;
            }

            if (caretBumpBack) {
              caretPos--;
            }

            // Make sure caret is within min and max position limits
            caretPos = caretPos > caretPosMax ? caretPosMax : caretPos < caretPosMin ? caretPosMin : caretPos;

            // Scoot the caret back or forth until it's in a non-mask position and within min/max position limits
            while (!isValidCaretPosition(caretPos) && caretPos > caretPosMin && caretPos < caretPosMax) {
              caretPos += caretBumpBack ? -1 : 1;
            }

            if ((caretBumpBack && caretPos < caretPosMax) || (isAddition && !isValidCaretPosition(caretPosOld))) {
              caretPos++;
            }
            oldCaretPosition = caretPos;
            setCaretPosition(this, caretPos);
          }

          function isValidCaretPosition(pos){ return maskCaretMap.indexOf(pos) > -1; }

          function getCaretPosition(input){
            if (!input) return 0;
            if (input.selectionStart !== undefined) {
              return input.selectionStart;
            } else if (document.selection) {
              // Curse you IE
              input.focus();
              var selection = document.selection.createRange();
              selection.moveStart('character', input.value ? -input.value.length : 0);
              return selection.text.length;
            }
            return 0;
          }

          function setCaretPosition(input, pos){
            if (!input) return 0;
            if (input.offsetWidth === 0 || input.offsetHeight === 0) {
              return; // Input's hidden
            }
            if (input.setSelectionRange) {
              input.focus();
              input.setSelectionRange(pos, pos);
            }
            else if (input.createTextRange) {
              // Curse you IE
              var range = input.createTextRange();
              range.collapse(true);
              range.moveEnd('character', pos);
              range.moveStart('character', pos);
              range.select();
            }
          }

          function getSelectionLength(input){
            if (!input) return 0;
            if (input.selectionStart !== undefined) {
              return (input.selectionEnd - input.selectionStart);
            }
            if (document.selection) {
              return (document.selection.createRange().text.length);
            }
            return 0;
          }

          // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
          if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function (searchElement /*, fromIndex */){
              if (this === null) {
                throw new TypeError();
              }
              var t = Object(this);
              var len = t.length >>> 0;
              if (len === 0) {
                return -1;
              }
              var n = 0;
              if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n !== n) { // shortcut for verifying if it's NaN
                  n = 0;
                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                  n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
              }
              if (n >= len) {
                return -1;
              }
              var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
              for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                  return k;
                }
              }
              return -1;
            };
          }

        };
      }
    };
  }
]);

/**
 * Add a clear button to form inputs to reset their value
 */
angular.module('ui.reset',[]).value('uiResetConfig',null).directive('uiReset', ['uiResetConfig', function (uiResetConfig) {
  'use strict';

  var resetValue = null;
  if (uiResetConfig !== undefined){
      resetValue = uiResetConfig;
  }
  return {
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      var aElement;
      aElement = angular.element('<a class="ui-reset" />');
      elm.wrap('<span class="ui-resetwrap" />').after(aElement);
      aElement.bind('click', function (e) {
        e.preventDefault();
        scope.$apply(function () {
          if (attrs.uiReset){
            ctrl.$setViewValue(scope.$eval(attrs.uiReset));
          }else{
            ctrl.$setViewValue(resetValue);
          }
          ctrl.$render();
        });
      });
    }
  };
}]);

/**
 * Set a $uiRoute boolean to see if the current route matches
 */
angular.module('ui.route', []).directive('uiRoute', ['$location', '$parse', function ($location, $parse) {
  'use strict';

  return {
    restrict: 'AC',
    scope: true,
    compile: function(tElement, tAttrs) {
      var useProperty;
      if (tAttrs.uiRoute) {
        useProperty = 'uiRoute';
      } else if (tAttrs.ngHref) {
        useProperty = 'ngHref';
      } else if (tAttrs.href) {
        useProperty = 'href';
      } else {
        throw new Error('uiRoute missing a route or href property on ' + tElement[0]);
      }
      return function ($scope, elm, attrs) {
        var modelSetter = $parse(attrs.ngModel || attrs.routeModel || '$uiRoute').assign;
        var watcher = angular.noop;

        // Used by href and ngHref
        function staticWatcher(newVal) {
          var hash = newVal.indexOf('#');
          if (hash > -1){
            newVal = newVal.substr(hash + 1);
          }
          watcher = function watchHref() {
            modelSetter($scope, ($location.path().indexOf(newVal) > -1));
          };
          watcher();
        }
        // Used by uiRoute
        function regexWatcher(newVal) {
          var hash = newVal.indexOf('#');
          if (hash > -1){
            newVal = newVal.substr(hash + 1);
          }
          watcher = function watchRegex() {
            var regexp = new RegExp('^' + newVal + '$', ['i']);
            modelSetter($scope, regexp.test($location.path()));
          };
          watcher();
        }

        switch (useProperty) {
          case 'uiRoute':
            // if uiRoute={{}} this will be undefined, otherwise it will have a value and $observe() never gets triggered
            if (attrs.uiRoute){
              regexWatcher(attrs.uiRoute);
            }else{
              attrs.$observe('uiRoute', regexWatcher);
            }
            break;
          case 'ngHref':
            // Setup watcher() every time ngHref changes
            if (attrs.ngHref){
              staticWatcher(attrs.ngHref);
            }else{
              attrs.$observe('ngHref', staticWatcher);
            }
            break;
          case 'href':
            // Setup watcher()
            staticWatcher(attrs.href);
        }

        $scope.$on('$routeChangeSuccess', function(){
          watcher();
        });

        //Added for compatibility with ui-router
        $scope.$on('$stateChangeSuccess', function(){
          watcher();
        });
      };
    }
  };
}]);

angular.module('ui.scroll.jqlite', ['ui.scroll']).service('jqLiteExtras', [
  '$log', '$window', function(console, window) {
    'use strict';

    return {
      registerFor: function(element) {
        var convertToPx, css, getMeasurements, getStyle, getWidthHeight, isWindow, scrollTo;
        css = angular.element.prototype.css;
        element.prototype.css = function(name, value) {
          var elem, self;
          self = this;
          elem = self[0];
          if (!(!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style)) {
            return css.call(self, name, value);
          }
        };
        isWindow = function(obj) {
          return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        };
        scrollTo = function(self, direction, value) {
          var elem, method, preserve, prop, _ref;
          elem = self[0];
          _ref = {
            top: ['scrollTop', 'pageYOffset', 'scrollLeft'],
            left: ['scrollLeft', 'pageXOffset', 'scrollTop']
          }[direction], method = _ref[0], prop = _ref[1], preserve = _ref[2];
          if (isWindow(elem)) {
            if (angular.isDefined(value)) {
              return elem.scrollTo(self[preserve].call(self), value);
            } else {
              if (prop in elem) {
                return elem[prop];
              } else {
                return elem.document.documentElement[method];
              }
            }
          } else {
            if (angular.isDefined(value)) {
              return elem[method] = value;
            } else {
              return elem[method];
            }
          }
        };
        if (window.getComputedStyle) {
          getStyle = function(elem) {
            return window.getComputedStyle(elem, null);
          };
          convertToPx = function(elem, value) {
            return parseFloat(value);
          };
        } else {
          getStyle = function(elem) {
            return elem.currentStyle;
          };
          convertToPx = function(elem, value) {
            var core_pnum, left, result, rnumnonpx, rs, rsLeft, style;
            core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
            rnumnonpx = new RegExp('^(' + core_pnum + ')(?!px)[a-z%]+$', 'i');
            if (!rnumnonpx.test(value)) {
              return parseFloat(value);
            } else {
              style = elem.style;
              left = style.left;
              rs = elem.runtimeStyle;
              rsLeft = rs && rs.left;
              if (rs) {
                rs.left = style.left;
              }
              style.left = value;
              result = style.pixelLeft;
              style.left = left;
              if (rsLeft) {
                rs.left = rsLeft;
              }
              return result;
            }
          };
        }
        getMeasurements = function(elem, measure) {
          var base, borderA, borderB, computedMarginA, computedMarginB, computedStyle, dirA, dirB, marginA, marginB, paddingA, paddingB, _ref;
          if (isWindow(elem)) {
            base = document.documentElement[{
              height: 'clientHeight',
              width: 'clientWidth'
            }[measure]];
            return {
              base: base,
              padding: 0,
              border: 0,
              margin: 0
            };
          }
          _ref = {
            width: [elem.offsetWidth, 'Left', 'Right'],
            height: [elem.offsetHeight, 'Top', 'Bottom']
          }[measure], base = _ref[0], dirA = _ref[1], dirB = _ref[2];
          computedStyle = getStyle(elem);
          paddingA = convertToPx(elem, computedStyle['padding' + dirA]) || 0;
          paddingB = convertToPx(elem, computedStyle['padding' + dirB]) || 0;
          borderA = convertToPx(elem, computedStyle['border' + dirA + 'Width']) || 0;
          borderB = convertToPx(elem, computedStyle['border' + dirB + 'Width']) || 0;
          computedMarginA = computedStyle['margin' + dirA];
          computedMarginB = computedStyle['margin' + dirB];
          marginA = convertToPx(elem, computedMarginA) || 0;
          marginB = convertToPx(elem, computedMarginB) || 0;
          return {
            base: base,
            padding: paddingA + paddingB,
            border: borderA + borderB,
            margin: marginA + marginB
          };
        };
        getWidthHeight = function(elem, direction, measure) {
          var computedStyle, measurements, result;
          measurements = getMeasurements(elem, direction);
          if (measurements.base > 0) {
            return {
              base: measurements.base - measurements.padding - measurements.border,
              outer: measurements.base,
              outerfull: measurements.base + measurements.margin
            }[measure];
          } else {
            computedStyle = getStyle(elem);
            result = computedStyle[direction];
            if (result < 0 || result === null) {
              result = elem.style[direction] || 0;
            }
            result = parseFloat(result) || 0;
            return {
              base: result - measurements.padding - measurements.border,
              outer: result,
              outerfull: result + measurements.padding + measurements.border + measurements.margin
            }[measure];
          }
        };
        return angular.forEach({
          before: function(newElem) {
            var children, elem, i, parent, self, _i, _ref;
            self = this;
            elem = self[0];
            parent = self.parent();
            children = parent.contents();
            if (children[0] === elem) {
              return parent.prepend(newElem);
            } else {
              for (i = _i = 1, _ref = children.length - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
                if (children[i] === elem) {
                  angular.element(children[i - 1]).after(newElem);
                  return;
                }
              }
              throw new Error('invalid DOM structure ' + elem.outerHTML);
            }
          },
          height: function(value) {
            var self;
            self = this;
            if (angular.isDefined(value)) {
              if (angular.isNumber(value)) {
                value = value + 'px';
              }
              return css.call(self, 'height', value);
            } else {
              return getWidthHeight(this[0], 'height', 'base');
            }
          },
          outerHeight: function(option) {
            return getWidthHeight(this[0], 'height', option ? 'outerfull' : 'outer');
          },
          /*
          UIScroller no longer relies on jQuery method offset. The jQLite implementation of the method
          is kept here just for the reference. Also the offset setter method was never implemented
          */

          offset: function(value) {
            var box, doc, docElem, elem, self, win;
            self = this;
            if (arguments.length) {
              if (value === void 0) {
                return self;
              } else {
                throw new Error('offset setter method is not implemented');
              }
            }
            box = {
              top: 0,
              left: 0
            };
            elem = self[0];
            doc = elem && elem.ownerDocument;
            if (!doc) {
              return;
            }
            docElem = doc.documentElement;
            if (elem.getBoundingClientRect != null) {
              box = elem.getBoundingClientRect();
            }
            win = doc.defaultView || doc.parentWindow;
            return {
              top: box.top + (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
              left: box.left + (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
            };
          },
          scrollTop: function(value) {
            return scrollTo(this, 'top', value);
          },
          scrollLeft: function(value) {
            return scrollTo(this, 'left', value);
          }
        }, function(value, key) {
          if (!element.prototype[key]) {
            return element.prototype[key] = value;
          }
        });
      }
    };
  }
]).run([
  '$log', '$window', 'jqLiteExtras', function(console, window, jqLiteExtras) {
    'use strict';

    if (!window.jQuery) {
      return jqLiteExtras.registerFor(angular.element);
    }
  }
]);

/*
//# sourceURL=src/scripts/ui-scroll-jqlite.js
*/


/*
 globals: angular, window

 List of used element methods available in JQuery but not in JQuery Lite

 element.before(elem)
 element.height()
 element.outerHeight(true)
 element.height(value) = only for Top/Bottom padding elements
 element.scrollTop()
 element.scrollTop(value)
 */

angular.module('ui.scroll', []).directive('uiScrollViewport', [
  '$log', function() {
    'use strict';

    return {
      controller: [
        '$scope', '$element', function(scope, element) {
          this.viewport = element;
          return this;
        }
      ]
    };
  }
]).directive('uiScroll', [
  '$log', '$injector', '$rootScope', '$timeout', function(console, $injector, $rootScope, $timeout) {
    'use strict';

    return {
      require: ['?^uiScrollViewport'],
      transclude: 'element',
      priority: 1000,
      terminal: true,
      compile: function(elementTemplate, attr, linker) {
        return function($scope, element, $attr, controllers) {
          var adapter, adapterOnScope, adjustBuffer, adjustRowHeight, applyUpdate, bof, bottomVisiblePos, buffer, bufferPadding, bufferSize, builder, clipBottom, clipTop, datasource, datasourceName, doAdjustment, doDelete, doInsert, doUpdate, enqueueFetch, eof, eventListener, fetch, finalize, first, getValueChain, hideElementBeforeAppend, insert, isDatasourceValid, itemName, loading, log, match, next, pending, reload, removeFromBuffer, resizeAndScrollHandler, ridActual, scrollHeight, setValueChain, shouldLoadBottom, shouldLoadTop, showElementAfterRender, topVisible, topVisiblePos, viewport, viewportScope, wheelHandler;
          log = console.debug || console.log;
          match = $attr.uiScroll.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/);
          if (!match) {
            throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + $attr.uiScroll + '\'');
          }
          itemName = match[1];
          datasourceName = match[2];
          getValueChain = function(targetScope, target) {
            var chain;
            if (!targetScope) {
              return;
            }
            chain = target.match(/^([\w]+)\.(.+)$/);
            if (!chain || chain.length !== 3) {
              return targetScope[target];
            }
            return getValueChain(targetScope[chain[1]], chain[2]);
          };
          setValueChain = function(targetScope, target, value, doNotSet) {
            var chain;
            if (!targetScope || !target) {
              return;
            }
            if (!(chain = target.match(/^([\w]+)\.(.+)$/))) {
              if (target.indexOf('.') !== -1) {
                return;
              }
            }
            if (!chain || chain.length !== 3) {
              if (!angular.isObject(targetScope[target]) && !doNotSet) {
                return targetScope[target] = value;
              }
              return targetScope[target] = value;
            }
            if (!angular.isObject(targetScope[chain[1]]) && !doNotSet) {
              targetScope[chain[1]] = {};
            }
            return setValueChain(targetScope[chain[1]], chain[2], value, doNotSet);
          };
          datasource = getValueChain($scope, datasourceName);
          isDatasourceValid = function() {
            return angular.isObject(datasource) && typeof datasource.get === 'function';
          };
          if (!isDatasourceValid()) {
            datasource = $injector.get(datasourceName);
            if (!isDatasourceValid()) {
              throw new Error('' + datasourceName + ' is not a valid datasource');
            }
          }
          bufferSize = Math.max(3, +$attr.bufferSize || 10);
          bufferPadding = function() {
            return viewport.outerHeight() * Math.max(0.1, +$attr.padding || 0.1);
          };
          scrollHeight = function(elem) {
            var _ref;
            return (_ref = elem[0].scrollHeight) != null ? _ref : elem[0].document.documentElement.scrollHeight;
          };
          builder = null;
          linker($scope.$new(), function(template) {
            var bottomPadding, createPadding, padding, repeaterType, topPadding, viewport;
            repeaterType = template[0].localName;
            if (repeaterType === 'dl') {
              throw new Error('ui-scroll directive does not support <' + template[0].localName + '> as a repeating tag: ' + template[0].outerHTML);
            }
            if (repeaterType !== 'li' && repeaterType !== 'tr') {
              repeaterType = 'div';
            }
            viewport = controllers[0] && controllers[0].viewport ? controllers[0].viewport : angular.element(window);
            viewport.css({
              'overflow-y': 'auto',
              'display': 'block'
            });
            padding = function(repeaterType) {
              var div, result, table;
              switch (repeaterType) {
                case 'tr':
                  table = angular.element('<table><tr><td><div></div></td></tr></table>');
                  div = table.find('div');
                  result = table.find('tr');
                  result.paddingHeight = function() {
                    return div.height.apply(div, arguments);
                  };
                  return result;
                default:
                  result = angular.element('<' + repeaterType + '></' + repeaterType + '>');
                  result.paddingHeight = result.height;
                  return result;
              }
            };
            createPadding = function(padding, element, direction) {
              element[{
                top: 'before',
                bottom: 'after'
              }[direction]](padding);
              return {
                paddingHeight: function() {
                  return padding.paddingHeight.apply(padding, arguments);
                },
                insert: function(element) {
                  return padding[{
                    top: 'after',
                    bottom: 'before'
                  }[direction]](element);
                }
              };
            };
            topPadding = createPadding(padding(repeaterType), element, 'top');
            bottomPadding = createPadding(padding(repeaterType), element, 'bottom');
            $scope.$on('$destroy', template.remove);
            return builder = {
              viewport: viewport,
              topPadding: topPadding.paddingHeight,
              bottomPadding: bottomPadding.paddingHeight,
              append: bottomPadding.insert,
              prepend: topPadding.insert,
              bottomDataPos: function() {
                return scrollHeight(viewport) - bottomPadding.paddingHeight();
              },
              topDataPos: function() {
                return topPadding.paddingHeight();
              }
            };
          });
          viewport = builder.viewport;
          viewportScope = viewport.scope() || $rootScope;
          topVisible = function(item) {
            adapter.topVisible = item.scope[itemName];
            adapter.topVisibleElement = item.element;
            adapter.topVisibleScope = item.scope;
            if ($attr.topVisible) {
              setValueChain(viewportScope, $attr.topVisible, adapter.topVisible);
            }
            if ($attr.topVisibleElement) {
              setValueChain(viewportScope, $attr.topVisibleElement, adapter.topVisibleElement);
            }
            if ($attr.topVisibleScope) {
              setValueChain(viewportScope, $attr.topVisibleScope, adapter.topVisibleScope);
            }
            if (typeof datasource.topVisible === 'function') {
              return datasource.topVisible(item);
            }
          };
          loading = function(value) {
            adapter.isLoading = value;
            if ($attr.isLoading) {
              setValueChain($scope, $attr.isLoading, value);
            }
            if (typeof datasource.loading === 'function') {
              return datasource.loading(value);
            }
          };
          ridActual = 0;
          first = 1;
          next = 1;
          buffer = [];
          pending = [];
          eof = false;
          bof = false;
          removeFromBuffer = function(start, stop) {
            var i, _i;
            for (i = _i = start; start <= stop ? _i < stop : _i > stop; i = start <= stop ? ++_i : --_i) {
              buffer[i].scope.$destroy();
              buffer[i].element.remove();
            }
            return buffer.splice(start, stop - start);
          };
          reload = function() {
            ridActual++;
            first = 1;
            next = 1;
            removeFromBuffer(0, buffer.length);
            builder.topPadding(0);
            builder.bottomPadding(0);
            pending = [];
            eof = false;
            bof = false;
            return adjustBuffer(ridActual);
          };
          bottomVisiblePos = function() {
            return viewport.scrollTop() + viewport.outerHeight();
          };
          topVisiblePos = function() {
            return viewport.scrollTop();
          };
          shouldLoadBottom = function() {
            return !eof && builder.bottomDataPos() < bottomVisiblePos() + bufferPadding();
          };
          clipBottom = function() {
            var bottomHeight, i, item, itemHeight, itemTop, newRow, overage, rowTop, _i, _ref;
            bottomHeight = 0;
            overage = 0;
            for (i = _i = _ref = buffer.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
              item = buffer[i];
              itemTop = item.element.offset().top;
              newRow = rowTop !== itemTop;
              rowTop = itemTop;
              if (newRow) {
                itemHeight = item.element.outerHeight(true);
              }
              if (builder.bottomDataPos() - bottomHeight - itemHeight > bottomVisiblePos() + bufferPadding()) {
                if (newRow) {
                  bottomHeight += itemHeight;
                }
                overage++;
                eof = false;
              } else {
                if (newRow) {
                  break;
                }
                overage++;
              }
            }
            if (overage > 0) {
              builder.bottomPadding(builder.bottomPadding() + bottomHeight);
              removeFromBuffer(buffer.length - overage, buffer.length);
              return next -= overage;
            }
          };
          shouldLoadTop = function() {
            return !bof && (builder.topDataPos() > topVisiblePos() - bufferPadding());
          };
          clipTop = function() {
            var item, itemHeight, itemTop, newRow, overage, rowTop, topHeight, _i, _len;
            topHeight = 0;
            overage = 0;
            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
              item = buffer[_i];
              itemTop = item.element.offset().top;
              newRow = rowTop !== itemTop;
              rowTop = itemTop;
              if (newRow) {
                itemHeight = item.element.outerHeight(true);
              }
              if (builder.topDataPos() + topHeight + itemHeight < topVisiblePos() - bufferPadding()) {
                if (newRow) {
                  topHeight += itemHeight;
                }
                overage++;
                bof = false;
              } else {
                if (newRow) {
                  break;
                }
                overage++;
              }
            }
            if (overage > 0) {
              builder.topPadding(builder.topPadding() + topHeight);
              removeFromBuffer(0, overage);
              return first += overage;
            }
          };
          enqueueFetch = function(rid, direction) {
            if (!adapter.isLoading) {
              loading(true);
            }
            if (pending.push(direction) === 1) {
              return fetch(rid);
            }
          };
          hideElementBeforeAppend = function(element) {
            element.displayTemp = element.css('display');
            return element.css('display', 'none');
          };
          showElementAfterRender = function(element) {
            if (element.hasOwnProperty('displayTemp')) {
              return element.css('display', element.displayTemp);
            }
          };
          insert = function(index, item) {
            var itemScope, toBeAppended, wrapper;
            itemScope = $scope.$new();
            itemScope[itemName] = item;
            toBeAppended = index > first;
            itemScope.$index = index;
            if (toBeAppended) {
              itemScope.$index--;
            }
            wrapper = {
              scope: itemScope
            };
            linker(itemScope, function(clone) {
              wrapper.element = clone;
              if (toBeAppended) {
                if (index === next) {
                  hideElementBeforeAppend(clone);
                  builder.append(clone);
                  return buffer.push(wrapper);
                } else {
                  buffer[index - first].element.after(clone);
                  return buffer.splice(index - first + 1, 0, wrapper);
                }
              } else {
                hideElementBeforeAppend(clone);
                builder.prepend(clone);
                return buffer.unshift(wrapper);
              }
            });
            return {
              appended: toBeAppended,
              wrapper: wrapper
            };
          };
          adjustRowHeight = function(appended, wrapper) {
            var newHeight;
            if (appended) {
              return builder.bottomPadding(Math.max(0, builder.bottomPadding() - wrapper.element.outerHeight(true)));
            } else {
              newHeight = builder.topPadding() - wrapper.element.outerHeight(true);
              if (newHeight >= 0) {
                return builder.topPadding(newHeight);
              } else {
                return viewport.scrollTop(viewport.scrollTop() + wrapper.element.outerHeight(true));
              }
            }
          };
          doAdjustment = function(rid, finalize) {
            var item, itemHeight, itemTop, newRow, rowTop, topHeight, _i, _len, _results;
            if (shouldLoadBottom()) {
              enqueueFetch(rid, true);
            } else {
              if (shouldLoadTop()) {
                enqueueFetch(rid, false);
              }
            }
            if (finalize) {
              finalize(rid);
            }
            if (pending.length === 0) {
              topHeight = 0;
              _results = [];
              for (_i = 0, _len = buffer.length; _i < _len; _i++) {
                item = buffer[_i];
                itemTop = item.element.offset().top;
                newRow = rowTop !== itemTop;
                rowTop = itemTop;
                if (newRow) {
                  itemHeight = item.element.outerHeight(true);
                }
                if (newRow && (builder.topDataPos() + topHeight + itemHeight < topVisiblePos())) {
                  _results.push(topHeight += itemHeight);
                } else {
                  if (newRow) {
                    topVisible(item);
                  }
                  break;
                }
              }
              return _results;
            }
          };
          adjustBuffer = function(rid, newItems, finalize) {
            if (newItems && newItems.length) {
              return $timeout(function() {
                var elt, itemTop, row, rowTop, rows, _i, _j, _len, _len1;
                rows = [];
                for (_i = 0, _len = newItems.length; _i < _len; _i++) {
                  row = newItems[_i];
                  elt = row.wrapper.element;
                  showElementAfterRender(elt);
                  itemTop = elt.offset().top;
                  if (rowTop !== itemTop) {
                    rows.push(row);
                    rowTop = itemTop;
                  }
                }
                for (_j = 0, _len1 = rows.length; _j < _len1; _j++) {
                  row = rows[_j];
                  adjustRowHeight(row.appended, row.wrapper);
                }
                return doAdjustment(rid, finalize);
              });
            } else {
              return doAdjustment(rid, finalize);
            }
          };
          finalize = function(rid, newItems) {
            return adjustBuffer(rid, newItems, function() {
              pending.shift();
              if (pending.length === 0) {
                return loading(false);
              } else {
                return fetch(rid);
              }
            });
          };
          fetch = function(rid) {
            var direction;
            direction = pending[0];
            if (direction) {
              if (buffer.length && !shouldLoadBottom()) {
                return finalize(rid);
              } else {
                return datasource.get(next, bufferSize, function(result) {
                  var item, newItems, _i, _len;
                  if ((rid && rid !== ridActual) || $scope.$$destroyed) {
                    return;
                  }
                  newItems = [];
                  if (result.length < bufferSize) {
                    eof = true;
                    builder.bottomPadding(0);
                  }
                  if (result.length > 0) {
                    clipTop();
                    for (_i = 0, _len = result.length; _i < _len; _i++) {
                      item = result[_i];
                      newItems.push(insert(++next, item));
                    }
                  }
                  return finalize(rid, newItems);
                });
              }
            } else {
              if (buffer.length && !shouldLoadTop()) {
                return finalize(rid);
              } else {
                return datasource.get(first - bufferSize, bufferSize, function(result) {
                  var i, newItems, _i, _ref;
                  if ((rid && rid !== ridActual) || $scope.$$destroyed) {
                    return;
                  }
                  newItems = [];
                  if (result.length < bufferSize) {
                    bof = true;
                    builder.topPadding(0);
                  }
                  if (result.length > 0) {
                    if (buffer.length) {
                      clipBottom();
                    }
                    for (i = _i = _ref = result.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
                      newItems.unshift(insert(--first, result[i]));
                    }
                  }
                  return finalize(rid, newItems);
                });
              }
            }
          };
          resizeAndScrollHandler = function() {
            if (!$rootScope.$$phase && !adapter.isLoading) {
              adjustBuffer();
              return $scope.$apply();
            }
          };
          wheelHandler = function(event) {
            var scrollTop, yMax;
            scrollTop = viewport[0].scrollTop;
            yMax = viewport[0].scrollHeight - viewport[0].clientHeight;
            if ((scrollTop === 0 && !bof) || (scrollTop === yMax && !eof)) {
              return event.preventDefault();
            }
          };
          viewport.bind('resize', resizeAndScrollHandler);
          viewport.bind('scroll', resizeAndScrollHandler);
          viewport.bind('mousewheel', wheelHandler);
          $scope.$watch(datasource.revision, reload);
          if (datasource.scope) {
            eventListener = datasource.scope.$new();
          } else {
            eventListener = $scope.$new();
          }
          $scope.$on('$destroy', function() {
            var item, _i, _len;
            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
              item = buffer[_i];
              item.scope.$destroy();
              item.element.remove();
            }
            viewport.unbind('resize', resizeAndScrollHandler);
            viewport.unbind('scroll', resizeAndScrollHandler);
            return viewport.unbind('mousewheel', wheelHandler);
          });
          adapter = {};
          adapter.isLoading = false;
          applyUpdate = function(wrapper, newItems) {
            var i, inserted, item, ndx, newItem, oldItemNdx, _i, _j, _k, _len, _len1, _len2;
            inserted = [];
            if (angular.isArray(newItems)) {
              if (newItems.length) {
                if (newItems.length === 1 && newItems[0] === wrapper.scope[itemName]) {
                  return inserted;
                } else {
                  ndx = wrapper.scope.$index;
                  if (ndx > first) {
                    oldItemNdx = ndx - first;
                  } else {
                    oldItemNdx = 1;
                  }
                  for (i = _i = 0, _len = newItems.length; _i < _len; i = ++_i) {
                    newItem = newItems[i];
                    inserted.push(insert(ndx + i, newItem));
                  }
                  removeFromBuffer(oldItemNdx, oldItemNdx + 1);
                  for (i = _j = 0, _len1 = buffer.length; _j < _len1; i = ++_j) {
                    item = buffer[i];
                    item.scope.$index = first + i;
                  }
                }
              } else {
                removeFromBuffer(wrapper.scope.$index - first, wrapper.scope.$index - first + 1);
                next--;
                for (i = _k = 0, _len2 = buffer.length; _k < _len2; i = ++_k) {
                  item = buffer[i];
                  item.scope.$index = first + i;
                }
              }
            }
            return inserted;
          };
          adapter.applyUpdates = function(arg1, arg2) {
            var inserted, wrapper, _i, _len, _ref, _ref1;
            inserted = [];
            ridActual++;
            if (angular.isFunction(arg1)) {
              _ref = buffer.slice(0);
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                wrapper = _ref[_i];
                inserted.concat(inserted, applyUpdate(wrapper, arg1(wrapper.scope[itemName], wrapper.scope, wrapper.element)));
              }
            } else {
              if (arg1 % 1 === 0) {
                if ((0 <= (_ref1 = arg1 - first - 1) && _ref1 < buffer.length)) {
                  inserted = applyUpdate(buffer[arg1 - first], arg2);
                }
              } else {
                throw new Error('applyUpdates - ' + arg1 + ' is not a valid index or outside of range');
              }
            }
            return adjustBuffer(ridActual, inserted);
          };
          if ($attr.adapter) {
            adapterOnScope = getValueChain($scope, $attr.adapter);
            if (!adapterOnScope) {
              setValueChain($scope, $attr.adapter, {});
              adapterOnScope = getValueChain($scope, $attr.adapter);
            }
            angular.extend(adapterOnScope, adapter);
            adapter = adapterOnScope;
          }
          doUpdate = function(locator, newItem) {
            var wrapper, _fn, _i, _len, _ref;
            if (angular.isFunction(locator)) {
              _fn = function(wrapper) {
                return locator(wrapper.scope);
              };
              for (_i = 0, _len = buffer.length; _i < _len; _i++) {
                wrapper = buffer[_i];
                _fn(wrapper);
              }
            } else {
              if ((0 <= (_ref = locator - first - 1) && _ref < buffer.length)) {
                buffer[locator - first - 1].scope[itemName] = newItem;
              }
            }
            return null;
          };
          doDelete = function(locator) {
            var i, item, temp, wrapper, _fn, _i, _j, _k, _len, _len1, _len2, _ref;
            if (angular.isFunction(locator)) {
              temp = [];
              for (_i = 0, _len = buffer.length; _i < _len; _i++) {
                item = buffer[_i];
                temp.unshift(item);
              }
              _fn = function(wrapper) {
                if (locator(wrapper.scope)) {
                  removeFromBuffer(temp.length - 1 - i, temp.length - i);
                  return next--;
                }
              };
              for (i = _j = 0, _len1 = temp.length; _j < _len1; i = ++_j) {
                wrapper = temp[i];
                _fn(wrapper);
              }
            } else {
              if ((0 <= (_ref = locator - first - 1) && _ref < buffer.length)) {
                removeFromBuffer(locator - first - 1, locator - first);
                next--;
              }
            }
            for (i = _k = 0, _len2 = buffer.length; _k < _len2; i = ++_k) {
              item = buffer[i];
              item.scope.$index = first + i;
            }
            return adjustBuffer();
          };
          doInsert = function(locator, item) {
            var i, inserted, _i, _len, _ref;
            inserted = [];
            if (angular.isFunction(locator)) {
              throw new Error('not implemented - Insert with locator function');
            } else {
              if ((0 <= (_ref = locator - first - 1) && _ref < buffer.length)) {
                inserted.push(insert(locator, item));
                next++;
              }
            }
            for (i = _i = 0, _len = buffer.length; _i < _len; i = ++_i) {
              item = buffer[i];
              item.scope.$index = first + i;
            }
            return adjustBuffer(null, inserted);
          };
          eventListener.$on('insert.item', function(event, locator, item) {
            return doInsert(locator, item);
          });
          eventListener.$on('update.items', function(event, locator, newItem) {
            return doUpdate(locator, newItem);
          });
          return eventListener.$on('delete.items', function(event, locator) {
            return doDelete(locator);
          });
        };
      }
    };
  }
]);

/*
//# sourceURL=src/scripts/ui-scroll.js
*/


/**
 * Adds a 'ui-scrollfix' class to the element when the page scrolls past it's position.
 * @param [offset] {int} optional Y-offset to override the detected offset.
 *   Takes 300 (absolute) or -300 or +300 (relative to detected)
 */
angular.module('ui.scrollfix',[]).directive('uiScrollfix', ['$window', function ($window) {
  'use strict';

  function getWindowScrollTop() {
    if (angular.isDefined($window.pageYOffset)) {
      return $window.pageYOffset;
    } else {
      var iebody = (document.compatMode && document.compatMode !== 'BackCompat') ? document.documentElement : document.body;
      return iebody.scrollTop;
    }
  }
  return {
    require: '^?uiScrollfixTarget',
    link: function (scope, elm, attrs, uiScrollfixTarget) {
      var absolute = true,
          shift = 0,
          fixLimit,
          $target = uiScrollfixTarget && uiScrollfixTarget.$element || angular.element($window);

      if (!attrs.uiScrollfix) {
          absolute = false;
      } else if (typeof(attrs.uiScrollfix) === 'string') {
        // charAt is generally faster than indexOf: http://jsperf.com/indexof-vs-charat
        if (attrs.uiScrollfix.charAt(0) === '-') {
          absolute = false;
          shift = - parseFloat(attrs.uiScrollfix.substr(1));
        } else if (attrs.uiScrollfix.charAt(0) === '+') {
          absolute = false;
          shift = parseFloat(attrs.uiScrollfix.substr(1));
        }
      }

      fixLimit = absolute ? attrs.uiScrollfix : elm[0].offsetTop + shift;

      function onScroll() {

        var limit = absolute ? attrs.uiScrollfix : elm[0].offsetTop + shift;

        // if pageYOffset is defined use it, otherwise use other crap for IE
        var offset = uiScrollfixTarget ? $target[0].scrollTop : getWindowScrollTop();
        if (!elm.hasClass('ui-scrollfix') && offset > limit) {
          elm.addClass('ui-scrollfix');
          fixLimit = limit;
        } else if (elm.hasClass('ui-scrollfix') && offset < fixLimit) {
          elm.removeClass('ui-scrollfix');
        }
      }

      $target.on('scroll', onScroll);

      // Unbind scroll event handler when directive is removed
      scope.$on('$destroy', function() {
        $target.off('scroll', onScroll);
      });
    }
  };
}]).directive('uiScrollfixTarget', [function () {
  'use strict';
  return {
    controller: ['$element', function($element) {
      this.$element = $element;
    }]
  };
}]);

/**
 * uiShow Directive
 *
 * Adds a 'ui-show' class to the element instead of display:block
 * Created to allow tighter control  of CSS without bulkier directives
 *
 * @param expression {boolean} evaluated expression to determine if the class should be added
 */
angular.module('ui.showhide',[])
.directive('uiShow', [function () {
  'use strict';

  return function (scope, elm, attrs) {
    scope.$watch(attrs.uiShow, function (newVal) {
      if (newVal) {
        elm.addClass('ui-show');
      } else {
        elm.removeClass('ui-show');
      }
    });
  };
}])

/**
 * uiHide Directive
 *
 * Adds a 'ui-hide' class to the element instead of display:block
 * Created to allow tighter control  of CSS without bulkier directives
 *
 * @param expression {boolean} evaluated expression to determine if the class should be added
 */
.directive('uiHide', [function () {
  'use strict';

  return function (scope, elm, attrs) {
    scope.$watch(attrs.uiHide, function (newVal) {
      if (newVal) {
        elm.addClass('ui-hide');
      } else {
        elm.removeClass('ui-hide');
      }
    });
  };
}])

/**
 * uiToggle Directive
 *
 * Adds a class 'ui-show' if true, and a 'ui-hide' if false to the element instead of display:block/display:none
 * Created to allow tighter control  of CSS without bulkier directives. This also allows you to override the
 * default visibility of the element using either class.
 *
 * @param expression {boolean} evaluated expression to determine if the class should be added
 */
.directive('uiToggle', [function () {
  'use strict';

  return function (scope, elm, attrs) {
    scope.$watch(attrs.uiToggle, function (newVal) {
      if (newVal) {
        elm.removeClass('ui-hide').addClass('ui-show');
      } else {
        elm.removeClass('ui-show').addClass('ui-hide');
      }
    });
  };
}]);

/**
 * Filters out all duplicate items from an array by checking the specified key
 * @param [key] {string} the name of the attribute of each object to compare for uniqueness
 if the key is empty, the entire object will be compared
 if the key === false then no filtering will be performed
 * @return {array}
 */
angular.module('ui.unique',[]).filter('unique', ['$parse', function ($parse) {
  'use strict';

  return function (items, filterOn) {

    if (filterOn === false) {
      return items;
    }

    if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
      var newItems = [],
        get = angular.isString(filterOn) ? $parse(filterOn) : function (item) { return item; };

      var extractValueToCompare = function (item) {
        return angular.isObject(item) ? get(item) : item;
      };

      angular.forEach(items, function (item) {
        var isDuplicate = false;

        for (var i = 0; i < newItems.length; i++) {
          if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
            isDuplicate = true;
            break;
          }
        }
        if (!isDuplicate) {
          newItems.push(item);
        }

      });
      items = newItems;
    }
    return items;
  };
}]);

/*
 * Author: Remy Alain Ticona Carbajal http://realtica.org
 * Description: The main objective of ng-uploader is to have a user control,
 * clean, simple, customizable, and above all very easy to implement.
 * Licence: MIT
 */

angular.module('ui.uploader', []).service('uiUploader', uiUploader);

uiUploader.$inject = ['$log'];

function uiUploader($log) {
    'use strict';

    /*jshint validthis: true */
    var self = this;
    self.files = [];
    self.options = {};
    self.activeUploads = 0;
    $log.info('uiUploader loaded');
    
    function addFiles(files) {
        for (var i = 0; i < files.length; i++) {
            self.files.push(files[i]);
        }
    }

    function getFiles() {
        return self.files;
    }

    function startUpload(options) {
        self.options = options;
        for (var i = 0; i < self.files.length; i++) {
            if (self.activeUploads == self.options.concurrency) {
                break;
            }
            if (self.files[i].active)
                continue;
            ajaxUpload(self.files[i], self.options.url);
        }
    }
    
    function removeFile(file){
        self.files.splice(self.files.indexOf(file),1);
    }
    
    function removeAll(){
        self.files.splice(0,self.files.length);
    }
    
    return {
        addFiles: addFiles,
        getFiles: getFiles,
        files: self.files,
        startUpload: startUpload,
        removeFile: removeFile,
        removeAll:removeAll
    };
    
    function getHumanSize(bytes) {
        var sizes = ['n/a', 'bytes', 'KiB', 'MiB', 'GiB', 'TB', 'PB', 'EiB', 'ZiB', 'YiB'];
        var i = +Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + sizes[isNaN(bytes) ? 0 : i + 1];
    }

    function ajaxUpload(file, url) {
        var xhr, formData, prop, data = '',
            key = '' || 'file';
        self.activeUploads += 1;
        file.active = true;
        xhr = new window.XMLHttpRequest();
        formData = new window.FormData();
        xhr.open('POST', url);

        // Triggered when upload starts:
        xhr.upload.onloadstart = function() {};

        // Triggered many times during upload:
        xhr.upload.onprogress = function(event) {
            if (!event.lengthComputable) {
                return;
            }
            // Update file size because it might be bigger than reported by
            // the fileSize:
            //$log.info("progres..");
            //console.info(event.loaded);
            file.loaded = event.loaded;
            file.humanSize = getHumanSize(event.loaded);
            self.options.onProgress(file);
        };

        // Triggered when upload is completed:
        xhr.onload = function() {
            self.activeUploads -= 1;
            startUpload(self.options);
            self.options.onCompleted(file, xhr.responseText);
        };

        // Triggered when upload fails:
        xhr.onerror = function() {};

        // Append additional data if provided:
        if (data) {
            for (prop in data) {
                if (data.hasOwnProperty(prop)) {
                    formData.append(prop, data[prop]);
                }
            }
        }

        // Append file data:
        formData.append(key, file, file.name);

        // Initiate upload:
        xhr.send(formData);

        return xhr;
    }

}

/**
 * General-purpose validator for ngModel.
 * angular.js comes with several built-in validation mechanism for input fields (ngRequired, ngPattern etc.) but using
 * an arbitrary validation function requires creation of a custom formatters and / or parsers.
 * The ui-validate directive makes it easy to use any function(s) defined in scope as a validator function(s).
 * A validator function will trigger validation on both model and input changes.
 *
 * @example <input ui-validate=" 'myValidatorFunction($value)' ">
 * @example <input ui-validate="{ foo : '$value > anotherModel', bar : 'validateFoo($value)' }">
 * @example <input ui-validate="{ foo : '$value > anotherModel' }" ui-validate-watch=" 'anotherModel' ">
 * @example <input ui-validate="{ foo : '$value > anotherModel', bar : 'validateFoo($value)' }" ui-validate-watch=" { foo : 'anotherModel' } ">
 *
 * @param ui-validate {string|object literal} If strings is passed it should be a scope's function to be used as a validator.
 * If an object literal is passed a key denotes a validation error key while a value should be a validator function.
 * In both cases validator function should take a value to validate as its argument and should return true/false indicating a validation result.
 */
angular.module('ui.validate',[]).directive('uiValidate', function () {
  'use strict';

  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      var validateFn, validators = {},
          validateExpr = scope.$eval(attrs.uiValidate);

      if (!validateExpr){ return;}

      if (angular.isString(validateExpr)) {
        validateExpr = { validator: validateExpr };
      }

      angular.forEach(validateExpr, function (exprssn, key) {
        validateFn = function (valueToValidate) {
          var expression = scope.$eval(exprssn, { '$value' : valueToValidate });
          if (angular.isObject(expression) && angular.isFunction(expression.then)) {
            // expression is a promise
            expression.then(function(){
              ctrl.$setValidity(key, true);
            }, function(){
              ctrl.$setValidity(key, false);
            });
            return valueToValidate;
          } else if (expression) {
            // expression is true
            ctrl.$setValidity(key, true);
            return valueToValidate;
          } else {
            // expression is false
            ctrl.$setValidity(key, false);
            return valueToValidate;
          }
        };
        validators[key] = validateFn;
        ctrl.$formatters.push(validateFn);
        ctrl.$parsers.push(validateFn);
      });

      function apply_watch(watch)
      {
          //string - update all validators on expression change
          if (angular.isString(watch))
          {
              scope.$watch(watch, function(){
                  angular.forEach(validators, function(validatorFn){
                      validatorFn(ctrl.$modelValue);
                  });
              });
              return;
          }

          //array - update all validators on change of any expression
          if (angular.isArray(watch))
          {
              angular.forEach(watch, function(expression){
                  scope.$watch(expression, function()
                  {
                      angular.forEach(validators, function(validatorFn){
                          validatorFn(ctrl.$modelValue);
                      });
                  });
              });
              return;
          }

          //object - update appropriate validator
          if (angular.isObject(watch))
          {
              angular.forEach(watch, function(expression, validatorKey)
              {
                  //value is string - look after one expression
                  if (angular.isString(expression))
                  {
                      scope.$watch(expression, function(){
                          validators[validatorKey](ctrl.$modelValue);
                      });
                  }

                  //value is array - look after all expressions in array
                  if (angular.isArray(expression))
                  {
                      angular.forEach(expression, function(intExpression)
                      {
                          scope.$watch(intExpression, function(){
                              validators[validatorKey](ctrl.$modelValue);
                          });
                      });
                  }
              });
          }
      }
      // Support for ui-validate-watch
      if (attrs.uiValidateWatch){
          apply_watch( scope.$eval(attrs.uiValidateWatch) );
      }
    }
  };
});

angular.module('ui.utils',  [
  'ui.event',
  'ui.format',
  'ui.highlight',
  'ui.include',
  'ui.indeterminate',
  'ui.inflector',
  'ui.jq',
  'ui.keypress',
  'ui.mask',
  'ui.reset',
  'ui.route',
  'ui.scrollfix',
  'ui.scroll',
  'ui.scroll.jqlite',
  'ui.showhide',
  'ui.unique',
  'ui.validate'
]);

(function ( window, angular, undefined ) {

angular.module('orderCloud.ui', [
	'orderCloud.media',
	'orderCloud.datepicker',
	'orderCloud.validate',
	'orderCloud.modal',
	'ui.utils'
])
;

/*
 * angular-ui-bootstrap
 * http://angular-ui.github.io/bootstrap/

 * Version: 0.12.1 - 2015-02-20
 * License: MIT
 */
angular.module("orderCloud.datepicker.tpls", ["template/datepicker/datepicker.html","template/datepicker/day.html","template/datepicker/month.html","template/datepicker/popup.html","template/datepicker/year.html"]);
angular.module('orderCloud.datepicker', ['orderCloud.datepicker.tpls','ui.bootstrap.dateparser', 'ui.bootstrap.position'])

    .constant('datepickerConfig', {
      formatDay: 'dd',
      formatMonth: 'MMMM',
      formatYear: 'yyyy',
      formatDayHeader: 'EEE',
      formatDayTitle: 'MMMM yyyy',
      formatMonthTitle: 'yyyy',
      datepickerMode: 'day',
      minMode: 'day',
      maxMode: 'year',
      showWeeks: false,
      startingDay: 0,
      yearRange: 20,
      minDate: null,
      maxDate: null
    })

    .controller('DatepickerController', ['$scope', '$attrs', '$parse', '$interpolate', '$timeout', '$log', 'dateFilter', 'datepickerConfig', function($scope, $attrs, $parse, $interpolate, $timeout, $log, dateFilter, datepickerConfig) {
      var self = this,
          ngModelCtrl = { $setViewValue: angular.noop }; // nullModelCtrl;

      // Modes chain
      this.modes = ['day', 'month', 'year'];

      // Configuration attributes
      angular.forEach(['formatDay', 'formatMonth', 'formatYear', 'formatDayHeader', 'formatDayTitle', 'formatMonthTitle',
        'minMode', 'maxMode', 'showWeeks', 'startingDay', 'yearRange'], function( key, index ) {
        self[key] = angular.isDefined($attrs[key]) ? (index < 8 ? $interpolate($attrs[key])($scope.$parent) : $scope.$parent.$eval($attrs[key])) : datepickerConfig[key];
      });

      // Watchable date attributes
      angular.forEach(['minDate', 'maxDate'], function( key ) {
        if ( $attrs[key] ) {
          $scope.$parent.$watch($parse($attrs[key]), function(value) {
            self[key] = value ? new Date(value) : null;
            self.refreshView();
          });
        } else {
          self[key] = datepickerConfig[key] ? new Date(datepickerConfig[key]) : null;
        }
      });

      $scope.datepickerMode = $scope.datepickerMode || datepickerConfig.datepickerMode;
      $scope.uniqueId = 'datepicker-' + $scope.$id + '-' + Math.floor(Math.random() * 10000);
      this.activeDate = angular.isDefined($attrs.initDate) ? $scope.$parent.$eval($attrs.initDate) : new Date();

      $scope.isActive = function(dateObject) {
        if (self.compare(dateObject.date, self.activeDate) === 0) {
          $scope.activeDateId = dateObject.uid;
          return true;
        }
        return false;
      };

      this.init = function( ngModelCtrl_ ) {
        ngModelCtrl = ngModelCtrl_;

        ngModelCtrl.$render = function() {
          self.render();
        };
      };

      this.render = function() {
        if ( ngModelCtrl.$modelValue ) {
          var date = new Date( ngModelCtrl.$modelValue ),
              isValid = !isNaN(date);

          if ( isValid ) {
            this.activeDate = date;
          } else {
            $log.error('Datepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
          }
          ngModelCtrl.$setValidity('date', isValid);
        }
        this.refreshView();
      };

      this.refreshView = function() {
        if ( this.element ) {
          this._refreshView();

          var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
          ngModelCtrl.$setValidity('date-disabled', !date || (this.element && !this.isDisabled(date)));
        }
      };

      this.createDateObject = function(date, format) {
        var model = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
        return {
          date: date,
          label: dateFilter(date, format),
          selected: model && this.compare(date, model) === 0,
          disabled: this.isDisabled(date),
          current: this.compare(date, new Date()) === 0
        };
      };

      this.isDisabled = function( date ) {
        return ((this.minDate && this.compare(date, this.minDate) < 0) || (this.maxDate && this.compare(date, this.maxDate) > 0) || ($attrs.dateDisabled && $scope.dateDisabled({date: date, mode: $scope.datepickerMode})));
      };

      // Split array into smaller arrays
      this.split = function(arr, size) {
        var arrays = [];
        while (arr.length > 0) {
          arrays.push(arr.splice(0, size));
        }
        return arrays;
      };

      $scope.select = function( date ) {
        if ( $scope.datepickerMode === self.minMode ) {
          var dt = ngModelCtrl.$modelValue ? new Date( ngModelCtrl.$modelValue ) : new Date(0, 0, 0, 0, 0, 0, 0);
          dt.setFullYear( date.getFullYear(), date.getMonth(), date.getDate() );
          ngModelCtrl.$setViewValue( dt );
          ngModelCtrl.$render();
        } else {
          self.activeDate = date;
          $scope.datepickerMode = self.modes[ self.modes.indexOf( $scope.datepickerMode ) - 1 ];
        }
      };

      $scope.move = function( direction ) {
        var year = self.activeDate.getFullYear() + direction * (self.step.years || 0),
            month = self.activeDate.getMonth() + direction * (self.step.months || 0);
        self.activeDate.setFullYear(year, month, 1);
        self.refreshView();
      };

      $scope.toggleMode = function( direction ) {
        direction = direction || 1;

        if (($scope.datepickerMode === self.maxMode && direction === 1) || ($scope.datepickerMode === self.minMode && direction === -1)) {
          return;
        }

        $scope.datepickerMode = self.modes[ self.modes.indexOf( $scope.datepickerMode ) + direction ];
      };

      // Key event mapper
      $scope.keys = { 13:'enter', 32:'space', 33:'pageup', 34:'pagedown', 35:'end', 36:'home', 37:'left', 38:'up', 39:'right', 40:'down' };

      var focusElement = function() {
        $timeout(function() {
          self.element[0].focus();
        }, 0 , false);
      };

      // Listen for focus requests from popup directive
      $scope.$on('datepicker.focus', focusElement);

      $scope.keydown = function( evt ) {
        var key = $scope.keys[evt.which];

        if ( !key || evt.shiftKey || evt.altKey ) {
          return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        if (key === 'enter' || key === 'space') {
          if ( self.isDisabled(self.activeDate)) {
            return; // do nothing
          }
          $scope.select(self.activeDate);
          focusElement();
        } else if (evt.ctrlKey && (key === 'up' || key === 'down')) {
          $scope.toggleMode(key === 'up' ? 1 : -1);
          focusElement();
        } else {
          self.handleKeyDown(key, evt);
          self.refreshView();
        }
      };
    }])

    .directive( 'datepicker', function () {
      return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/datepicker/datepicker.html',
        scope: {
          datepickerMode: '=?',
          dateDisabled: '&'
        },
        require: ['datepicker', '?^ngModel'],
        controller: 'DatepickerController',
        link: function(scope, element, attrs, ctrls) {
          var datepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];

          if ( ngModelCtrl ) {
            datepickerCtrl.init( ngModelCtrl );
          }
        }
      };
    })

    .directive('daypicker', ['dateFilter', function (dateFilter) {
      return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/datepicker/day.html',
        require: '^datepicker',
        link: function(scope, element, attrs, ctrl) {
          scope.showWeeks = ctrl.showWeeks;

          ctrl.step = { months: 1 };
          ctrl.element = element;

          var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          function getDaysInMonth( year, month ) {
            return ((month === 1) && (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0))) ? 29 : DAYS_IN_MONTH[month];
          }

          function getDates(startDate, n) {
            var dates = new Array(n), current = new Date(startDate), i = 0;
            current.setHours(12); // Prevent repeated dates because of timezone bug
            while ( i < n ) {
              dates[i++] = new Date(current);
              current.setDate( current.getDate() + 1 );
            }
            return dates;
          }

          ctrl._refreshView = function() {
            var year = ctrl.activeDate.getFullYear(),
                month = ctrl.activeDate.getMonth(),
                firstDayOfMonth = new Date(year, month, 1),
                difference = ctrl.startingDay - firstDayOfMonth.getDay(),
                numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : - difference,
                firstDate = new Date(firstDayOfMonth);

            if ( numDisplayedFromPreviousMonth > 0 ) {
              firstDate.setDate( - numDisplayedFromPreviousMonth + 1 );
            }

            // 42 is the number of days on a six-month calendar
            var days = getDates(firstDate, 42);
            for (var i = 0; i < 42; i ++) {
              days[i] = angular.extend(ctrl.createDateObject(days[i], ctrl.formatDay), {
                secondary: days[i].getMonth() !== month,
                uid: scope.uniqueId + '-' + i
              });
            }

            scope.labels = new Array(7);
            for (var j = 0; j < 7; j++) {
              scope.labels[j] = {
                abbr: dateFilter(days[j].date, ctrl.formatDayHeader),
                full: dateFilter(days[j].date, 'EEEE')
              };
            }

            scope.title = dateFilter(ctrl.activeDate, ctrl.formatDayTitle);
            scope.rows = ctrl.split(days, 7);

            if ( scope.showWeeks ) {
              scope.weekNumbers = [];
              var weekNumber = getISO8601WeekNumber( scope.rows[0][0].date ),
                  numWeeks = scope.rows.length;
              while( scope.weekNumbers.push(weekNumber++) < numWeeks ) {}
            }
          };

          ctrl.compare = function(date1, date2) {
            return (new Date( date1.getFullYear(), date1.getMonth(), date1.getDate() ) - new Date( date2.getFullYear(), date2.getMonth(), date2.getDate() ) );
          };

          function getISO8601WeekNumber(date) {
            var checkDate = new Date(date);
            checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
            var time = checkDate.getTime();
            checkDate.setMonth(0); // Compare with Jan 1
            checkDate.setDate(1);
            return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
          }

          ctrl.handleKeyDown = function( key, evt ) {
            var date = ctrl.activeDate.getDate();

            if (key === 'left') {
              date = date - 1;   // up
            } else if (key === 'up') {
              date = date - 7;   // down
            } else if (key === 'right') {
              date = date + 1;   // down
            } else if (key === 'down') {
              date = date + 7;
            } else if (key === 'pageup' || key === 'pagedown') {
              var month = ctrl.activeDate.getMonth() + (key === 'pageup' ? - 1 : 1);
              ctrl.activeDate.setMonth(month, 1);
              date = Math.min(getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth()), date);
            } else if (key === 'home') {
              date = 1;
            } else if (key === 'end') {
              date = getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth());
            }
            ctrl.activeDate.setDate(date);
          };

          ctrl.refreshView();
        }
      };
    }])

    .directive('monthpicker', ['dateFilter', function (dateFilter) {
      return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/datepicker/month.html',
        require: '^datepicker',
        link: function(scope, element, attrs, ctrl) {
          ctrl.step = { years: 1 };
          ctrl.element = element;

          ctrl._refreshView = function() {
            var months = new Array(12),
                year = ctrl.activeDate.getFullYear();

            for ( var i = 0; i < 12; i++ ) {
              months[i] = angular.extend(ctrl.createDateObject(new Date(year, i, 1), ctrl.formatMonth), {
                uid: scope.uniqueId + '-' + i
              });
            }

            scope.title = dateFilter(ctrl.activeDate, ctrl.formatMonthTitle);
            scope.rows = ctrl.split(months, 3);
          };

          ctrl.compare = function(date1, date2) {
            return new Date( date1.getFullYear(), date1.getMonth() ) - new Date( date2.getFullYear(), date2.getMonth() );
          };

          ctrl.handleKeyDown = function( key, evt ) {
            var date = ctrl.activeDate.getMonth();

            if (key === 'left') {
              date = date - 1;   // up
            } else if (key === 'up') {
              date = date - 3;   // down
            } else if (key === 'right') {
              date = date + 1;   // down
            } else if (key === 'down') {
              date = date + 3;
            } else if (key === 'pageup' || key === 'pagedown') {
              var year = ctrl.activeDate.getFullYear() + (key === 'pageup' ? - 1 : 1);
              ctrl.activeDate.setFullYear(year);
            } else if (key === 'home') {
              date = 0;
            } else if (key === 'end') {
              date = 11;
            }
            ctrl.activeDate.setMonth(date);
          };

          ctrl.refreshView();
        }
      };
    }])

    .directive('yearpicker', ['dateFilter', function (dateFilter) {
      return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/datepicker/year.html',
        require: '^datepicker',
        link: function(scope, element, attrs, ctrl) {
          var range = ctrl.yearRange;

          ctrl.step = { years: range };
          ctrl.element = element;

          function getStartingYear( year ) {
            return parseInt((year - 1) / range, 10) * range + 1;
          }

          ctrl._refreshView = function() {
            var years = new Array(range);

            for ( var i = 0, start = getStartingYear(ctrl.activeDate.getFullYear()); i < range; i++ ) {
              years[i] = angular.extend(ctrl.createDateObject(new Date(start + i, 0, 1), ctrl.formatYear), {
                uid: scope.uniqueId + '-' + i
              });
            }

            scope.title = [years[0].label, years[range - 1].label].join(' - ');
            scope.rows = ctrl.split(years, 5);
          };

          ctrl.compare = function(date1, date2) {
            return date1.getFullYear() - date2.getFullYear();
          };

          ctrl.handleKeyDown = function( key, evt ) {
            var date = ctrl.activeDate.getFullYear();

            if (key === 'left') {
              date = date - 1;   // up
            } else if (key === 'up') {
              date = date - 5;   // down
            } else if (key === 'right') {
              date = date + 1;   // down
            } else if (key === 'down') {
              date = date + 5;
            } else if (key === 'pageup' || key === 'pagedown') {
              date += (key === 'pageup' ? - 1 : 1) * ctrl.step.years;
            } else if (key === 'home') {
              date = getStartingYear( ctrl.activeDate.getFullYear() );
            } else if (key === 'end') {
              date = getStartingYear( ctrl.activeDate.getFullYear() ) + range - 1;
            }
            ctrl.activeDate.setFullYear(date);
          };

          ctrl.refreshView();
        }
      };
    }])

    .constant('datepickerPopupConfig', {
      datepickerPopup: 'yyyy-MM-dd',
      currentText: 'Today',
      clearText: 'Clear',
      closeText: 'Done',
      closeOnDateSelection: true,
      appendToBody: false,
      showButtonBar: false
    })

    .directive('datepickerPopup', ['$compile', '$parse', '$document', '$position', 'dateFilter', 'dateParser', 'datepickerPopupConfig',
      function ($compile, $parse, $document, $position, dateFilter, dateParser, datepickerPopupConfig) {
        return {
          restrict: 'EA',
          require: 'ngModel',
          scope: {
            isOpen: '=?',
            currentText: '@',
            clearText: '@',
            closeText: '@',
            dateDisabled: '&'
          },
          link: function(scope, element, attrs, ngModel) {
            var dateFormat,
                closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$parent.$eval(attrs.closeOnDateSelection) : datepickerPopupConfig.closeOnDateSelection,
                appendToBody = angular.isDefined(attrs.datepickerAppendToBody) ? scope.$parent.$eval(attrs.datepickerAppendToBody) : datepickerPopupConfig.appendToBody;

            scope.showButtonBar = angular.isDefined(attrs.showButtonBar) ? scope.$parent.$eval(attrs.showButtonBar) : datepickerPopupConfig.showButtonBar;

            scope.getText = function( key ) {
              return scope[key + 'Text'] || datepickerPopupConfig[key + 'Text'];
            };

            attrs.$observe('datepickerPopup', function(value) {
              dateFormat = value || datepickerPopupConfig.datepickerPopup;
              ngModel.$render();
            });

            // popup element used to display calendar
            var popupEl = angular.element('<div datepicker-popup-wrap><div datepicker></div></div>');
            popupEl.attr({
              'ng-model': 'date',
              'ng-change': 'dateSelection()'
            });

            function cameltoDash( string ){
              return string.replace(/([A-Z])/g, function($1) { return '-' + $1.toLowerCase(); });
            }

            // datepicker element
            var datepickerEl = angular.element(popupEl.children()[0]);
            if ( attrs.datepickerOptions ) {
              angular.forEach(scope.$parent.$eval(attrs.datepickerOptions), function( value, option ) {
                datepickerEl.attr( cameltoDash(option), value );
              });
            }

            scope.watchData = {};
            angular.forEach(['minDate', 'maxDate', 'datepickerMode'], function( key ) {
              if ( attrs[key] ) {
                var getAttribute = $parse(attrs[key]);
                scope.$parent.$watch(getAttribute, function(value){
                  scope.watchData[key] = value;
                });
                datepickerEl.attr(cameltoDash(key), 'watchData.' + key);

                // Propagate changes from datepicker to outside
                if ( key === 'datepickerMode' ) {
                  var setAttribute = getAttribute.assign;
                  scope.$watch('watchData.' + key, function(value, oldvalue) {
                    if ( value !== oldvalue ) {
                      setAttribute(scope.$parent, value);
                    }
                  });
                }
              }
            });
            if (attrs.dateDisabled) {
              datepickerEl.attr('date-disabled', 'dateDisabled({ date: date, mode: mode })');
            }

            function parseDate(viewValue) {
              if (!viewValue) {
                ngModel.$setValidity('date', true);
                return null;
              } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
                ngModel.$setValidity('date', true);
                return viewValue;
              } else if (angular.isString(viewValue)) {
                var date = dateParser.parse(viewValue, dateFormat) || new Date(viewValue);
                if (isNaN(date)) {
                  ngModel.$setValidity('date', false);
                  return undefined;
                } else {
                  ngModel.$setValidity('date', true);
                  return date;
                }
              } else {
                ngModel.$setValidity('date', false);
                return undefined;
              }
            }
            ngModel.$parsers.unshift(parseDate);

            // Inner change
            scope.dateSelection = function(dt) {
              if (angular.isDefined(dt)) {
                scope.date = dt;
              }
              ngModel.$setViewValue(scope.date);
              ngModel.$render();

              if ( closeOnDateSelection ) {
                scope.isOpen = false;
                element[0].focus();
              }
            };

            element.bind('input change keyup', function() {
              scope.$apply(function() {
                scope.date = ngModel.$modelValue;
              });
            });

            // Outter change
            ngModel.$render = function() {
              var date = ngModel.$viewValue ? dateFilter(ngModel.$viewValue, dateFormat) : '';
              element.val(date);
              scope.date = parseDate( ngModel.$modelValue );
            };

            var documentClickBind = function(event) {
              if (scope.isOpen && event.target !== element[0]) {
                scope.$apply(function() {
                  scope.isOpen = false;
                });
              }
            };

            var keydown = function(evt, noApply) {
              scope.keydown(evt);
            };
            element.bind('keydown', keydown);

            scope.keydown = function(evt) {
              if (evt.which === 27) {
                evt.preventDefault();
                evt.stopPropagation();
                scope.close();
              } else if (evt.which === 40 && !scope.isOpen) {
                scope.isOpen = true;
              }
            };

            scope.$watch('isOpen', function(value) {
              if (value) {
                scope.$broadcast('datepicker.focus');
                scope.position = appendToBody ? $position.offset(element) : $position.position(element);
                scope.position.top = scope.position.top + element.prop('offsetHeight');

                $document.bind('click', documentClickBind);
              } else {
                $document.unbind('click', documentClickBind);
              }
            });

            scope.select = function( date ) {
              if (date === 'today') {
                var today = new Date();
                if (angular.isDate(ngModel.$modelValue)) {
                  date = new Date(ngModel.$modelValue);
                  date.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
                } else {
                  date = new Date(today.setHours(0, 0, 0, 0));
                }
              }
              scope.dateSelection( date );
            };

            scope.close = function() {
              scope.isOpen = false;
              element[0].focus();
            };

            var $popup = $compile(popupEl)(scope);
            // Prevent jQuery cache memory leak (template is now redundant after linking)
            popupEl.remove();

            if ( appendToBody ) {
              $document.find('body').append($popup);
            } else {
              element.after($popup);
            }

            scope.$on('$destroy', function() {
              $popup.remove();
              element.unbind('keydown', keydown);
              $document.unbind('click', documentClickBind);
            });
          }
        };
      }])

    .directive('datepickerPopupWrap', function() {
      return {
        restrict:'EA',
        replace: true,
        transclude: true,
        templateUrl: 'template/datepicker/popup.html',
        link:function (scope, element, attrs) {
          element.bind('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
          });
        }
      };
    });

angular.module('ui.bootstrap.dateparser', [])

    .service('dateParser', ['$locale', 'orderByFilter', function($locale, orderByFilter) {

      this.parsers = {};

      var formatCodeToRegex = {
        'yyyy': {
          regex: '\\d{4}',
          apply: function(value) { this.year = +value; }
        },
        'yy': {
          regex: '\\d{2}',
          apply: function(value) { this.year = +value + 2000; }
        },
        'y': {
          regex: '\\d{1,4}',
          apply: function(value) { this.year = +value; }
        },
        'MMMM': {
          regex: $locale.DATETIME_FORMATS.MONTH.join('|'),
          apply: function(value) { this.month = $locale.DATETIME_FORMATS.MONTH.indexOf(value); }
        },
        'MMM': {
          regex: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
          apply: function(value) { this.month = $locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value); }
        },
        'MM': {
          regex: '0[1-9]|1[0-2]',
          apply: function(value) { this.month = value - 1; }
        },
        'M': {
          regex: '[1-9]|1[0-2]',
          apply: function(value) { this.month = value - 1; }
        },
        'dd': {
          regex: '[0-2][0-9]{1}|3[0-1]{1}',
          apply: function(value) { this.date = +value; }
        },
        'd': {
          regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
          apply: function(value) { this.date = +value; }
        },
        'EEEE': {
          regex: $locale.DATETIME_FORMATS.DAY.join('|')
        },
        'EEE': {
          regex: $locale.DATETIME_FORMATS.SHORTDAY.join('|')
        }
      };

      function createParser(format) {
        var map = [], regex = format.split('');

        angular.forEach(formatCodeToRegex, function(data, code) {
          var index = format.indexOf(code);

          if (index > -1) {
            format = format.split('');

            regex[index] = '(' + data.regex + ')';
            format[index] = '$'; // Custom symbol to define consumed part of format
            for (var i = index + 1, n = index + code.length; i < n; i++) {
              regex[i] = '';
              format[i] = '$';
            }
            format = format.join('');

            map.push({ index: index, apply: data.apply });
          }
        });

        return {
          regex: new RegExp('^' + regex.join('') + '$'),
          map: orderByFilter(map, 'index')
        };
      }

      this.parse = function(input, format) {
        if ( !angular.isString(input) || !format ) {
          return input;
        }

        format = $locale.DATETIME_FORMATS[format] || format;

        if ( !this.parsers[format] ) {
          this.parsers[format] = createParser(format);
        }

        var parser = this.parsers[format],
            regex = parser.regex,
            map = parser.map,
            results = input.match(regex);

        if ( results && results.length ) {
          var fields = { year: 1900, month: 0, date: 1, hours: 0 }, dt;

          for( var i = 1, n = results.length; i < n; i++ ) {
            var mapper = map[i-1];
            if ( mapper.apply ) {
              mapper.apply.call(fields, results[i]);
            }
          }

          if ( isValid(fields.year, fields.month, fields.date) ) {
            dt = new Date( fields.year, fields.month, fields.date, fields.hours);
          }

          return dt;
        }
      };

      // Check if date is valid for specific month (and year for February).
      // Month: 0 = Jan, 1 = Feb, etc
      function isValid(year, month, date) {
        if ( month === 1 && date > 28) {
          return date === 29 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
        }

        if ( month === 3 || month === 5 || month === 8 || month === 10) {
          return date < 31;
        }

        return true;
      }
    }]);

angular.module('ui.bootstrap.position', [])

/**
 * A set of utility methods that can be use to retrieve position of DOM elements.
 * It is meant to be used where we need to absolute-position DOM elements in
 * relation to other, existing elements (this is the case for tooltips, popovers,
 * typeahead suggestions etc.).
 */
    .factory('$position', ['$document', '$window', function ($document, $window) {

      function getStyle(el, cssprop) {
        if (el.currentStyle) { //IE
          return el.currentStyle[cssprop];
        } else if ($window.getComputedStyle) {
          return $window.getComputedStyle(el)[cssprop];
        }
        // finally try and get inline style
        return el.style[cssprop];
      }

      /**
       * Checks if a given element is statically positioned
       * @param element - raw DOM element
       */
      function isStaticPositioned(element) {
        return (getStyle(element, 'position') || 'static' ) === 'static';
      }

      /**
       * returns the closest, non-statically positioned parentOffset of a given element
       * @param element
       */
      var parentOffsetEl = function (element) {
        var docDomEl = $document[0];
        var offsetParent = element.offsetParent || docDomEl;
        while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent) ) {
          offsetParent = offsetParent.offsetParent;
        }
        return offsetParent || docDomEl;
      };

      return {
        /**
         * Provides read-only equivalent of jQuery's position function:
         * http://api.jquery.com/position/
         */
        position: function (element) {
          var elBCR = this.offset(element);
          var offsetParentBCR = { top: 0, left: 0 };
          var offsetParentEl = parentOffsetEl(element[0]);
          if (offsetParentEl != $document[0]) {
            offsetParentBCR = this.offset(angular.element(offsetParentEl));
            offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
            offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
          }

          var boundingClientRect = element[0].getBoundingClientRect();
          return {
            width: boundingClientRect.width || element.prop('offsetWidth'),
            height: boundingClientRect.height || element.prop('offsetHeight'),
            top: elBCR.top - offsetParentBCR.top,
            left: elBCR.left - offsetParentBCR.left
          };
        },

        /**
         * Provides read-only equivalent of jQuery's offset function:
         * http://api.jquery.com/offset/
         */
        offset: function (element) {
          var boundingClientRect = element[0].getBoundingClientRect();
          return {
            width: boundingClientRect.width || element.prop('offsetWidth'),
            height: boundingClientRect.height || element.prop('offsetHeight'),
            top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
            left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
          };
        },

        /**
         * Provides coordinates for the targetEl in relation to hostEl
         */
        positionElements: function (hostEl, targetEl, positionStr, appendToBody) {

          var positionStrParts = positionStr.split('-');
          var pos0 = positionStrParts[0], pos1 = positionStrParts[1] || 'center';

          var hostElPos,
              targetElWidth,
              targetElHeight,
              targetElPos;

          hostElPos = appendToBody ? this.offset(hostEl) : this.position(hostEl);

          targetElWidth = targetEl.prop('offsetWidth');
          targetElHeight = targetEl.prop('offsetHeight');

          var shiftWidth = {
            center: function () {
              return hostElPos.left + hostElPos.width / 2 - targetElWidth / 2;
            },
            left: function () {
              return hostElPos.left;
            },
            right: function () {
              return hostElPos.left + hostElPos.width;
            }
          };

          var shiftHeight = {
            center: function () {
              return hostElPos.top + hostElPos.height / 2 - targetElHeight / 2;
            },
            top: function () {
              return hostElPos.top;
            },
            bottom: function () {
              return hostElPos.top + hostElPos.height;
            }
          };

          switch (pos0) {
            case 'right':
              targetElPos = {
                top: shiftHeight[pos1](),
                left: shiftWidth[pos0]()
              };
              break;
            case 'left':
              targetElPos = {
                top: shiftHeight[pos1](),
                left: hostElPos.left - targetElWidth
              };
              break;
            case 'bottom':
              targetElPos = {
                top: shiftHeight[pos0](),
                left: shiftWidth[pos1]()
              };
              break;
            default:
              targetElPos = {
                top: hostElPos.top - targetElHeight,
                left: shiftWidth[pos1]()
              };
              break;
          }

          return targetElPos;
        }
      };
    }]);

angular.module("template/datepicker/datepicker.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datepicker/datepicker.html",
      "<div ng-switch=\"datepickerMode\" role=\"application\" ng-keydown=\"keydown($event)\">\n" +
      "  <daypicker ng-switch-when=\"day\" tabindex=\"0\"></daypicker>\n" +
      "  <monthpicker ng-switch-when=\"month\" tabindex=\"0\"></monthpicker>\n" +
      "  <yearpicker ng-switch-when=\"year\" tabindex=\"0\"></yearpicker>\n" +
      "</div>");
}]);

angular.module("template/datepicker/day.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datepicker/day.html",
      "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
      "  <thead>\n" +
      "    <tr>\n" +
      "      <th><button type=\"button\" class=\"am-btn\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"fa fa-chevron-left\"></i></button></th>\n" +
      "      <th colspan=\"{{5 + showWeeks}}\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"am-btn\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
      "      <th><button type=\"button\" class=\"am-btn\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"fa fa-chevron-right\"></i></button></th>\n" +
      "    </tr>\n" +
      "    <tr>\n" +
      "      <th ng-show=\"showWeeks\" class=\"text-center\"></th>\n" +
      "      <th ng-repeat=\"label in labels track by $index\" class=\"text-center\"><small aria-label=\"{{label.full}}\">{{label.abbr}}</small></th>\n" +
      "    </tr>\n" +
      "  </thead>\n" +
      "  <tbody>\n" +
      "    <tr ng-repeat=\"row in rows track by $index\">\n" +
      "      <td ng-show=\"showWeeks\" class=\"text-center h6\"><em>{{ weekNumbers[$index] }}</em></td>\n" +
      "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
      "        <button type=\"button\" style=\"width:100%;\" class=\"am-btn\" ng-class=\"{'am-primary': dt.selected, 'am-secondary': isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'am-clr-18-text': dt.secondary, 'am-clr-5-text': dt.current}\">{{dt.label}}</span></button>\n" +
      "      </td>\n" +
      "    </tr>\n" +
      "  </tbody>\n" +
      "</table>\n" +
      "");
}]);

angular.module("template/datepicker/month.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datepicker/month.html",
      "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
      "  <thead>\n" +
      "    <tr>\n" +
      "      <th><button type=\"button\" class=\"am-btn\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"fa fa-chevron-left\"></i></button></th>\n" +
      "      <th><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"am-btn\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
      "      <th><button type=\"button\" class=\"am-btn\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"fa fa-chevron-right\"></i></button></th>\n" +
      "    </tr>\n" +
      "  </thead>\n" +
      "  <tbody>\n" +
      "    <tr ng-repeat=\"row in rows track by $index\">\n" +
      "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
      "        <button type=\"button\" style=\"width:100%;\" class=\"am-btn\" ng-class=\"{'am-primary': dt.selected, 'am-secondary': isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'am-clr-5-text': dt.current}\">{{dt.label}}</span></button>\n" +
      "      </td>\n" +
      "    </tr>\n" +
      "  </tbody>\n" +
      "</table>\n" +
      "");
}]);

angular.module("template/datepicker/popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datepicker/popup.html",
      "<ul class=\"datepicker-dropdown\" ng-style=\"{display: (isOpen && 'block') || 'none', top: position.top+'px', left: position.left+'px'}\" ng-keydown=\"keydown($event)\">\n" +
      "	<li class=\"oc-datepicker\" ng-transclude></li>\n" +
      "	<li ng-if=\"showButtonBar\" style=\"padding:10px 9px 2px\">\n" +
      "		<span class=\"btn-group pull-left\">\n" +
      "			<button type=\"button\" class=\"btn btn-sm btn-info\" ng-click=\"select('today')\">{{ getText('current') }}</button>\n" +
      "			<button type=\"button\" class=\"btn btn-sm btn-danger\" ng-click=\"select(null)\">{{ getText('clear') }}</button>\n" +
      "		</span>\n" +
      "		<button type=\"button\" class=\"btn btn-sm btn-success pull-right\" ng-click=\"close()\">{{ getText('close') }}</button>\n" +
      "	</li>\n" +
      "</ul>\n" +
      "");
}]);

angular.module("template/datepicker/year.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datepicker/year.html",
      "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
      "  <thead>\n" +
      "    <tr>\n" +
      "      <th><button type=\"button\" class=\"am-btn\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"fa fa-chevron-left\"></i></button></th>\n" +
      "      <th colspan=\"3\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"am-btn\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
      "      <th><button type=\"button\" class=\"am-btn\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"fa fa-chevron-right\"></i></button></th>\n" +
      "    </tr>\n" +
      "  </thead>\n" +
      "  <tbody>\n" +
      "    <tr ng-repeat=\"row in rows track by $index\">\n" +
      "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
      "        <button type=\"button\" style=\"width:100%;\" class=\"am-btn\" ng-class=\"{'am-primary': dt.selected, 'am-secondary': isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'am-clr-5-text': dt.current}\">{{dt.label}}</span></button>\n" +
      "      </td>\n" +
      "    </tr>\n" +
      "  </tbody>\n" +
      "</table>\n" +
      "");
}]);
angular.module('orderCloud.media', [])
	.factory('$ocMedia', mdMediaFactory)
	.constant('MEDIA', MEDIA_CONSTANT)
	.constant('MEDIA_PRIORITY', MEDIA_PRIORITY_CONSTANT);

function MEDIA_CONSTANT() {
	return {
		'sm': '(max-width: 600px)',
		'gt-sm': '(min-width: 600px)',
		'md': '(min-width: 600px) and (max-width: 960px)',
		'gt-md': '(min-width: 960px)',
		'lg': '(min-width: 960px) and (max-width: 1200px)',
		'gt-lg': '(min-width: 1200px)'
	}
}

function MEDIA_PRIORITY_CONSTANT() {
	return [
		'gt-lg',
		'lg',
		'gt-md',
		'md',
		'gt-sm',
		'sm'
	]
}

function mdMediaFactory(MEDIA, MEDIA_PRIORITY, $rootScope, $window) {
	var queries = {};
	var mqls = {};
	var results = {};
	var normalizeCache = {};

	$ocMedia.getResponsiveAttribute = getResponsiveAttribute;
	$ocMedia.getQuery = getQuery;
	$ocMedia.watchResponsiveAttributes = watchResponsiveAttributes;

	return $ocMedia;

	function $ocMedia(query) {
		var validated = queries[query];
		if (angular.isUndefined(validated)) {
			validated = queries[query] = validate(query);
		}

		var result = results[validated];
		if (angular.isUndefined(result)) {
			result = add(validated);
		}

		return result;
	}

	function validate(query) {
		return MEDIA[query] ||
			((query.charAt(0) !== '(') ? ('(' + query + ')') : query);
	}

	function add(query) {
		var result = mqls[query] = $window.matchMedia(query);
		result.addListener(onQueryChange);
		return (results[result.media] = !!result.matches);
	}

	function onQueryChange(query) {
		$rootScope.$evalAsync(function() {
			results[query.media] = !!query.matches;
		});
	}

	function getQuery(name) {
		return mqls[name];
	}

	function getResponsiveAttribute(attrs, attrName) {
		for (var i = 0; i < MEDIA_PRIORITY.length; i++) {
			var mediaName = MEDIA_PRIORITY[i];
			if (!mqls[queries[mediaName]].matches) {
				continue;
			}

			var normalizedName = getNormalizedName(attrs, attrName + '-' + mediaName);
			if (attrs[normalizedName]) {
				return attrs[normalizedName];
			}
		}

		// fallback on unprefixed
		return attrs[getNormalizedName(attrs, attrName)];
	}

	function watchResponsiveAttributes(attrNames, attrs, watchFn) {
		var unwatchFns = [];
		attrNames.forEach(function(attrName) {
			var normalizedName = getNormalizedName(attrs, attrName);
			if (attrs[normalizedName]) {
				unwatchFns.push(
					attrs.$observe(normalizedName, angular.bind(void 0, watchFn, null)));
			}

			for (var mediaName in MEDIA) {
				normalizedName = getNormalizedName(attrs, attrName + '-' + mediaName);
				if (!attrs[normalizedName]) {
					return;
				}

				unwatchFns.push(attrs.$observe(normalizedName, angular.bind(void 0, watchFn, mediaName)));
			}
		});

		return function unwatch() {
			unwatchFns.forEach(function(fn) { fn(); })
		};
	}

	// Improves performance dramatically
	function getNormalizedName(attrs, attrName) {
		return normalizeCache[attrName] ||
			(normalizeCache[attrName] = attrs.$normalize(attrName));
	}
}
mdMediaFactory.$inject = ["MEDIA", "MEDIA_PRIORITY", "$rootScope", "$window"];

angular.module("orderCloud.modal.tpls", ["template/modal/backdrop.html","template/modal/window.html"]);
angular.module('orderCloud.modal', ['orderCloud.modal.tpls'])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
	.factory('$$stackedMap', function () {
		return {
			createNew: function () {
				var stack = [];

				return {
					add: function (key, value) {
						stack.push({
							key: key,
							value: value
						});
					},
					get: function (key) {
						for (var i = 0; i < stack.length; i++) {
							if (key == stack[i].key) {
								return stack[i];
							}
						}
					},
					keys: function() {
						var keys = [];
						for (var i = 0; i < stack.length; i++) {
							keys.push(stack[i].key);
						}
						return keys;
					},
					top: function () {
						return stack[stack.length - 1];
					},
					remove: function (key) {
						var idx = -1;
						for (var i = 0; i < stack.length; i++) {
							if (key == stack[i].key) {
								idx = i;
								break;
							}
						}
						return stack.splice(idx, 1)[0];
					},
					removeTop: function () {
						return stack.splice(stack.length - 1, 1)[0];
					},
					length: function () {
						return stack.length;
					}
				};
			}
		};
	})

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
	.directive('modalBackdrop', ['$timeout', function ($timeout) {
		return {
			restrict: 'EA',
			replace: true,
			templateUrl: 'template/modal/backdrop.html',
			compile: function (tElement, tAttrs) {
				tElement.addClass(tAttrs.backdropClass);
				return linkFn;
			}
		};

		function linkFn(scope, element, attrs) {
			scope.animate = false;

			//trigger CSS transitions
			$timeout(function () {
				scope.animate = true;
			});
		}
	}])

	.directive('modalWindow', ['$modalStack', '$q', function ($modalStack, $q) {
		return {
			restrict: 'EA',
			scope: {
				index: '@',
				animate: '='
			},
			replace: true,
			transclude: true,
			templateUrl: function(tElement, tAttrs) {
				return tAttrs.templateUrl || 'template/modal/window.html';
			},
			link: function (scope, element, attrs) {
				element.addClass(attrs.windowClass || '');
				scope.size = attrs.size;

				scope.close = function (evt) {
					var modal = $modalStack.getTop();
					if (modal && modal.value.backdrop && modal.value.backdrop != 'static' && (evt.target === evt.currentTarget)) {
						evt.preventDefault();
						evt.stopPropagation();
						$modalStack.dismiss(modal.key, 'backdrop click');
					}
				};

				// This property is only added to the scope for the purpose of detecting when this directive is rendered.
				// We can detect that by using this property in the template associated with this directive and then use
				// {@link Attribute#$observe} on it. For more details please see {@link TableColumnResize}.
				scope.$isRendered = true;

				// Deferred object that will be resolved when this modal is render.
				var modalRenderDeferObj = $q.defer();
				// Observe function will be called on next digest cycle after compilation, ensuring that the DOM is ready.
				// In order to use this way of finding whether DOM is ready, we need to observe a scope property used in modal's template.
				attrs.$observe('modalRender', function (value) {
					if (value == 'true') {
						modalRenderDeferObj.resolve();
					}
				});

				modalRenderDeferObj.promise.then(function () {
					// trigger CSS transitions
					scope.animate = true;

					var inputsWithAutofocus = element[0].querySelectorAll('[autofocus]');
					/**
					 * Auto-focusing of a freshly-opened modal element causes any child elements
					 * with the autofocus attribute to lose focus. This is an issue on touch
					 * based devices which will show and then hide the onscreen keyboard.
					 * Attempts to refocus the autofocus element via JavaScript will not reopen
					 * the onscreen keyboard. Fixed by updated the focusing logic to only autofocus
					 * the modal element if the modal does not contain an autofocus element.
					 */
					if (inputsWithAutofocus.length) {
						inputsWithAutofocus[0].focus();
					} else {
						element[0].focus();
					}

					// Notify {@link $modalStack} that modal is rendered.
					var modal = $modalStack.getTop();
					if (modal) {
						$modalStack.modalRendered(modal.key);
					}
				});
			}
		};
	}])

	.directive('modalAnimationClass', [
		function () {
			return {
				compile: function (tElement, tAttrs) {
					if (tAttrs.modalAnimation) {
						tElement.addClass(tAttrs.modalAnimationClass);
					}
				}
			};
		}])

	.directive('modalTransclude', function () {
		return {
			link: function($scope, $element, $attrs, controller, $transclude) {
				$transclude($scope.$parent, function(clone) {
					$element.empty();
					$element.append(clone);
				});
			}
		};
	})

	.factory('$modalStack', ['$animate', '$timeout', '$document', '$compile', '$rootScope', '$$stackedMap',
		function ($animate, $timeout, $document, $compile, $rootScope, $$stackedMap) {

			var OPENED_MODAL_CLASS = 'modal-open';

			var backdropDomEl, backdropScope;
			var openedWindows = $$stackedMap.createNew();
			var $modalStack = {};

			function backdropIndex() {
				var topBackdropIndex = -1;
				var opened = openedWindows.keys();
				for (var i = 0; i < opened.length; i++) {
					if (openedWindows.get(opened[i]).value.backdrop) {
						topBackdropIndex = i;
					}
				}
				return topBackdropIndex;
			}

			$rootScope.$watch(backdropIndex, function(newBackdropIndex){
				if (backdropScope) {
					backdropScope.index = newBackdropIndex;
				}
			});

			function removeModalWindow(modalInstance) {

				var body = $document.find('body').eq(0);
				var modalWindow = openedWindows.get(modalInstance).value;

				//clean up the stack
				openedWindows.remove(modalInstance);

				//remove window DOM element
				removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, function() {
					body.toggleClass(OPENED_MODAL_CLASS, openedWindows.length() > 0);
					checkRemoveBackdrop();
				});
			}

			function checkRemoveBackdrop() {
				//remove backdrop if no longer needed
				if (backdropDomEl && backdropIndex() == -1) {
					var backdropScopeRef = backdropScope;
					removeAfterAnimate(backdropDomEl, backdropScope, function () {
						backdropScopeRef = null;
					});
					backdropDomEl = undefined;
					backdropScope = undefined;
				}
			}

			function removeAfterAnimate(domEl, scope, done) {
				// Closing animation
				scope.animate = false;

				if (domEl.attr('modal-animation') && $animate.enabled()) {
					// transition out

					//TODO: Bug when using angular 1.4+ the replacement below fixes it and is from https://github.com/angular-ui/bootstrap/issues/3633

					//domEl.one('$animate:close', function closeFn() {
					//	$rootScope.$evalAsync(afterAnimating);
					//});
					$rootScope.$evalAsync(afterAnimating);
				} else {
					// Ensure this call is async
					$timeout(afterAnimating);
				}

				function afterAnimating() {
					if (afterAnimating.done) {
						return;
					}
					afterAnimating.done = true;

					domEl.remove();
					scope.$destroy();
					if (done) {
						done();
					}
				}
			}

			$document.bind('keydown', function (evt) {
				var modal;

				if (evt.which === 27) {
					modal = openedWindows.top();
					if (modal && modal.value.keyboard) {
						evt.preventDefault();
						$rootScope.$apply(function () {
							$modalStack.dismiss(modal.key, 'escape key press');
						});
					}
				}
			});

			$modalStack.open = function (modalInstance, modal) {

				var modalOpener = $document[0].activeElement;

				openedWindows.add(modalInstance, {
					deferred: modal.deferred,
					renderDeferred: modal.renderDeferred,
					modalScope: modal.scope,
					backdrop: modal.backdrop,
					keyboard: modal.keyboard
				});

				var body = $document.find('body').eq(0),
					currBackdropIndex = backdropIndex();

				if (currBackdropIndex >= 0 && !backdropDomEl) {
					backdropScope = $rootScope.$new(true);
					backdropScope.index = currBackdropIndex;
					var angularBackgroundDomEl = angular.element('<div modal-backdrop="modal-backdrop"></div>');
					angularBackgroundDomEl.attr('backdrop-class', modal.backdropClass);
					if (modal.animation) {
						angularBackgroundDomEl.attr('modal-animation', 'true');
					}
					backdropDomEl = $compile(angularBackgroundDomEl)(backdropScope);
					body.append(backdropDomEl);
				}

				var angularDomEl = angular.element('<div modal-window="modal-window"></div>');
				angularDomEl.attr({
					'template-url': modal.windowTemplateUrl,
					'window-class': modal.windowClass,
					'size': modal.size,
					'index': openedWindows.length() - 1,
					'animate': 'animate'
				}).html(modal.content);
				if (modal.animation) {
					angularDomEl.attr('modal-animation', 'true');
				}

				var modalDomEl = $compile(angularDomEl)(modal.scope);
				openedWindows.top().value.modalDomEl = modalDomEl;
				openedWindows.top().value.modalOpener = modalOpener;
				body.append(modalDomEl);
				body.addClass(OPENED_MODAL_CLASS);
			};

			function broadcastClosing(modalWindow, resultOrReason, closing) {
				return !modalWindow.value.modalScope.$broadcast('modal.closing', resultOrReason, closing).defaultPrevented;
			}

			$modalStack.close = function (modalInstance, result) {
				var modalWindow = openedWindows.get(modalInstance);
				if (modalWindow && broadcastClosing(modalWindow, result, true)) {
					modalWindow.value.deferred.resolve(result);
					removeModalWindow(modalInstance);
					modalWindow.value.modalOpener.focus();
					return true;
				}
				return !modalWindow;
			};

			$modalStack.dismiss = function (modalInstance, reason) {
				var modalWindow = openedWindows.get(modalInstance);
				if (modalWindow && broadcastClosing(modalWindow, reason, false)) {
					modalWindow.value.deferred.reject(reason);
					removeModalWindow(modalInstance);
					modalWindow.value.modalOpener.focus();
					return true;
				}
				return !modalWindow;
			};

			$modalStack.dismissAll = function (reason) {
				var topModal = this.getTop();
				while (topModal && this.dismiss(topModal.key, reason)) {
					topModal = this.getTop();
				}
			};

			$modalStack.getTop = function () {
				return openedWindows.top();
			};

			$modalStack.modalRendered = function (modalInstance) {
				var modalWindow = openedWindows.get(modalInstance);
				if (modalWindow) {
					modalWindow.value.renderDeferred.resolve();
				}
			};

			return $modalStack;
		}])

	.provider('$modal', function () {

		var $modalProvider = {
			options: {
				animation: true,
				backdrop: true, //can also be false or 'static'
				keyboard: true
			},
			$get: ['$injector', '$rootScope', '$q', '$templateRequest', '$controller', '$modalStack',
				function ($injector, $rootScope, $q, $templateRequest, $controller, $modalStack) {

					var $modal = {};

					function getTemplatePromise(options) {
						return options.template ? $q.when(options.template) :
							$templateRequest(angular.isFunction(options.templateUrl) ? (options.templateUrl)() : options.templateUrl);
					}

					function getResolvePromises(resolves) {
						var promisesArr = [];
						angular.forEach(resolves, function (value) {
							if (angular.isFunction(value) || angular.isArray(value)) {
								promisesArr.push($q.when($injector.invoke(value)));
							}
						});
						return promisesArr;
					}

					$modal.open = function (modalOptions) {

						var modalResultDeferred = $q.defer();
						var modalOpenedDeferred = $q.defer();
						var modalRenderDeferred = $q.defer();

						//prepare an instance of a modal to be injected into controllers and returned to a caller
						var modalInstance = {
							result: modalResultDeferred.promise,
							opened: modalOpenedDeferred.promise,
							rendered: modalRenderDeferred.promise,
							close: function (result) {
								return $modalStack.close(modalInstance, result);
							},
							dismiss: function (reason) {
								return $modalStack.dismiss(modalInstance, reason);
							}
						};

						//merge and clean up options
						modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
						modalOptions.resolve = modalOptions.resolve || {};

						//verify options
						if (!modalOptions.template && !modalOptions.templateUrl) {
							throw new Error('One of template or templateUrl options is required.');
						}

						var templateAndResolvePromise =
							$q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));


						templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {

							var modalScope = (modalOptions.scope || $rootScope).$new();
							modalScope.$close = modalInstance.close;
							modalScope.$dismiss = modalInstance.dismiss;

							var ctrlInstance, ctrlLocals = {};
							var resolveIter = 1;

							//controllers
							if (modalOptions.controller) {
								ctrlLocals.$scope = modalScope;
								ctrlLocals.$modalInstance = modalInstance;
								angular.forEach(modalOptions.resolve, function (value, key) {
									ctrlLocals[key] = tplAndVars[resolveIter++];
								});

								ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
								if (modalOptions.controllerAs) {
									modalScope[modalOptions.controllerAs] = ctrlInstance;
								}
							}

							$modalStack.open(modalInstance, {
								scope: modalScope,
								deferred: modalResultDeferred,
								renderDeferred: modalRenderDeferred,
								content: tplAndVars[0],
								animation: modalOptions.animation,
								backdrop: modalOptions.backdrop,
								keyboard: modalOptions.keyboard,
								backdropClass: modalOptions.backdropClass,
								windowClass: modalOptions.windowClass,
								windowTemplateUrl: modalOptions.windowTemplateUrl,
								size: modalOptions.size
							});

						}, function resolveError(reason) {
							modalResultDeferred.reject(reason);
						});

						templateAndResolvePromise.then(function () {
							modalOpenedDeferred.resolve(true);
						}, function (reason) {
							modalOpenedDeferred.reject(reason);
						});

						return modalInstance;
					};

					return $modal;
				}]
		};

		return $modalProvider;
	});

angular.module("template/modal/backdrop.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("template/modal/backdrop.html",
		"<div class=\"modal-backdrop\" modal-animation-class=\"fade\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1040 + (index && 1 || 0) + index*10}\"></div>"
	);
}]);

angular.module("template/modal/window.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("template/modal/window.html",
		"<div modal-render=\"{{$isRendered}}\" tabindex=\"-1\" role=\"dialog\" class=\"modal\" modal-animation-class=\"fade\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1050 + index*10, display: 'block'}\" ng-click=\"close($event)\">\n" +
		"<div class=\"modal-dialog\" ng-class=\"size ? 'modal-' + size : ''\"><div class=\"modal-content\" modal-transclude></div></div></div>"
	);
}]);
angular.module('orderCloud.validate', [])
	.directive('ocValidate', ocValidate)
	.controller( 'ocValidateCtrl', ocValidateCtrl)
	.factory( 'ocValidateService', ocValidateService)
;

function ocValidate() {
	var directive = {
		restrict: 'A',
		controller: 'ocValidateCtrl'
	};

	return directive;
}

function ocValidateCtrl($scope, $compile, $element, ocValidateService) {
	$element.after( $compile( ocValidateService.setMessages($element) )( $scope ));
}
ocValidateCtrl.$inject = ["$scope", "$compile", "$element", "ocValidateService"];

function ocValidateService() {
	var service = {
		setMessages: _setMessages
	};

	return service;
	///////////////

	function _setMessages(e) {
		var formName = e[0].form.name,
			fieldName = e.attr('name');

		if (!formName || !fieldName) return;

		var html = [
			'<div ng-messages="' + formName + '.' + fieldName + '.$error">',
				'<p class="oc-validate" ng-message="required">Required field</p>',
				'<p class="oc-validate" ng-message="minlength">Min of ' + e.attr('ng-minlength') + ' characters</p>',
				'<p class="oc-validate" ng-message="maxlength">Max of ' + e.attr('ng-maxlength') + ' characters</p>',
				'<p class="oc-validate" ng-message="pattern">Must follow ' + (fieldName.toLowerCase()) + ' pattern</p>',
				'<p class="oc-validate" ng-message="email">Invalid email</p>',
				'<p class="oc-validate" ng-message="number">Numbers only</p>',
				'<p class="oc-validate" ng-message="url">Invalid URL</p>',
				'<p class="oc-validate" ng-message="date">Invalid date</p>',
				'<p class="oc-validate" ng-message="time">Invalid time</p>',
				'<p class="oc-validate" ng-message="month">Invalid month</p>',
				'<p class="oc-validate" ng-message="week">Invalid week</p>',
			'</div>'
		].join('');

		return html;
	}
}


})( window, window.angular );
