angular.module('signupApp')
	.directive('dateValidator', function ($log) {
		return {
			require: 'ngModel',
			restrict: 'A',
			link: function (scope, elem, attrs, ctrl) {
				var startDate,
						endDate;

				scope.$watch(attrs.ngModel, function (newVal, oldVal, scope) {
					startDate = newVal;
					$log.log("DATE startDate: " + startDate);
					check();
				});

				scope.$watch(attrs.dateValidator, function (newVal, oldVal, scope) {
					endDate = newVal;
					$log.log("DATE endDate: " + endDate);
					check();
				});

				var check = function () {
					if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
						return;
					}

					if (!validate(startDate)) {
						startDate = new Date(startDate);
						if (!validate(startDate)) {
							return;
						}
					}

					if (!validate(endDate)) {
						endDate = new Date(endDate);
						if (!validate(endDate)) {
							return;
						}
					}

					$log.log("DATE checking: " + startDate + " < " + endDate);

					if (startDate < endDate) {
						$log.log("DATE valid");
						ctrl.$setValidity('dateValidator', true);
					}
					else {
						$log.log("DATE invalid");
						ctrl.$setValidity('dateValidator', false);
					}

					return;
				};

				var validate = function (date) {
					if (Object.prototype.toString.call(date) === '[object Date]') {
						if (isNaN(date.getTime())) {
							$log.log("DATE validation failed: " + date);
							return false;
						}
						else {
							$log.log("DATE validation passed: " + date);
							return true;
						}
					}
					else {
						$log.log("DATE date not [object Date]: " + date);
					  return false;
					}
				};

				ctrl.$parsers.unshift(dateValidator);
        ctrl.$formatters.push(dateValidator);

			}
		};
	});
