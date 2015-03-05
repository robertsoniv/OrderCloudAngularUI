/**
 * OrderCloudUI - v0.0.1 - 2015-03-04
 * https://github.com/robertsoniv/OrderCloudAngularUI
 *
 * Copyright (c) 2015 Four51, Inc.
 * Licensed MIT <https://raw.github.com/robertsoniv/OrderCloudAngularUI/master/LICENSE>
 */
(function ( window, angular, undefined ) {

angular.module('orderCloud.ui', [])
;
angular.module('orderCloud.ui')
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
	$($element).after( $compile( ocValidateService.setMessages($element) )( $scope ));
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

		var html = [];
		html.push('<p ng-messages="' + formName + '.' + fieldName + '.$error">');

		if (e.attr('ng-required'))
			html.push('<small class="oc-validate" ng-message="required">Required field</small>');

		if (e.attr('ng-minlength'))
			html.push('<small class="oc-validate" ng-message="minlength">Min of ' + e.attr('ng-minlength') + ' characters</small>');

		if (e.attr('ng-maxlength'))
			html.push('<small class="oc-validate" ng-message="minlength">Max of ' + e.attr('ng-maxlength') + ' characters</small>');

		if (e.attr('ng-pattern'))
			html.push('<small class="oc-validate" ng-message="pattern">Must follow ' + (fieldName.toLowerCase()) + ' pattern</small>');

		switch (e.attr('type')) {
			case('email'):
				html.push('<small class="oc-validate" ng-message="email">Invalid email</small>');
				break;
			case('number'):
				html.push('<small class="oc-validate" ng-message="number">Invalid number</small>');
				break;
			case('url'):
				html.push('<small class="oc-validate" ng-message="url">Invalid url</small>');
				break;

			//TODO: The rest of these will need a ui for setting valid JS dates/times/months/weeks
			case('date'):
				html.push('<small class="oc-validate" ng-message="date">Invalid date</small>');
				break;
			case('time'):
				html.push('<small class="oc-validate" ng-message="time">Invalid time</small>');
				break;
			case('month'):
				html.push('<small class="oc-validate" ng-message="month">Invalid month</small>');
				break;
			case('week'):
				html.push('<small class="oc-validate" ng-message="week">Invalid week</small>');
				break;
			default:
				break;
		}
		html.push('</p>');
		return html.join('');
	}
}


})( window, window.angular );
