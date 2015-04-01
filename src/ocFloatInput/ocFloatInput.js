angular.module('orderCloud.ui')
	.directive('ocFloatInput', ocFloatInput)
;

function ocFloatInput() {
	var obj = {
		link: function(scope, element) {
			var inputElement = element.find('INPUT');
			inputElement.on('blur', function() {
				if (inputElement.val()) {
					inputElement.addClass('oc-filled');
				} else {
					$(inputElement).removeClass('oc-filled');
				}
			});
		}
	};
	return obj;
}