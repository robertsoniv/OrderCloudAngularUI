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

