angular.module('signupApp')
	.directive('dateRangeValidator', function ($log) {
		return {
			require: 'ngModel',
			restrict: 'A',
			link: function (scope, elem, attrs, ctrl) {
				var setDate,
						minDate,
						maxDate;

				scope.$watch(attrs.ngModel, function (newVal, oldVal, scope) {
					setDate = newVal;
					$log.log("DATE setDate: " + setDate);
					check();
				});

				scope.$watch(attrs.dateRangeValidator, function (newVal, oldVal, scope) {
					list = newVal;
					minDate = list.list_visible_start;
					maxDate = list.list_visible_end;
					$log.log("DATE minDate: " + minDate + " maxDate: " + maxDate);
					check();
				});

				var check = function () {
					if (typeof setDate === 'undefined' || typeof minDate === 'undefined' || typeof maxDate === 'undefined') {
						return;
					}

					if (!validate(setDate)) {
						setDate = new Date(setDate);
						if (!validate(setDate)) {
							return;
						}
					}

					if (!validate(minDate)) {
						minDate = new Date(minDate);
						if (!validate(minDate)) {
							return;
						}
					}

					if (!validate(maxDate)) {
						maxDate = new Date(maxDate);
						if (!validate(maxDate)) {
							return;
						}
					}

					$log.log("DATE checking: " + minDate + " < " + setDate + " > " + maxDate);

					if (setDate >= minDate && setDate <= maxDate) {
						$log.log("DATE valid");
						ctrl.$setValidity('dateRangeValidator', true);
					}
					else {
						$log.log("DATE invalid");
						ctrl.$setValidity('dateRangeValidator', false);
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

				ctrl.$parsers.unshift(dateRangeValidator);
        ctrl.$formatters.push(dateRangeValidator);

			}
		};
	});
