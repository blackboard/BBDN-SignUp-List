angular.module('signupApp').service('modalService', ['$uibModal', '$log',
    function ($uibModal, $log) {

        var modalDefaults = {
            backdrop: true,
            keyboard: true,
            modalFade: true
        };

        var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Save'
        };

        this.showModal = function (customModalDefaults, customModalOptions) {
            if (!customModalDefaults) customModalDefaults = {};
            if (!customModalOptions) customModalOptions = {};
            customModalDefaults.backdrop = 'static';
            return this.show(customModalDefaults, customModalOptions);
        };

        this.show = function (customModalDefaults, customModalOptions) {
            //Create temp objects to work with since we're in a singleton service
            var tempModalDefaults = {};
            var tempModalOptions = {};

            //Map angular-ui modal custom defaults to modal defaults defined in service
            angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

            //Map modal.html $scope custom properties to defaults defined in service
            angular.extend(tempModalOptions, modalOptions, customModalOptions);

            if (!tempModalDefaults.controller) {
                tempModalDefaults.controller = function ($scope, $uibModalInstance, $log) {
                    $scope.modalOptions = tempModalOptions;
                    $scope.modalOptions.ok = function (result) {
                        $log.log("Save Clicked: " + JSON.stringify(result));
                        $uibModalInstance.close(false);
                    };
                    $scope.modalOptions.waitlist = function (result) {
                        $log.log("Waitlist Clicked: " + JSON.stringify(result));
                        $uibModalInstance.close(true);
                    };
                    $scope.modalOptions.close = function (result) {
                      $log.log("Cancel Clicked: " + JSON.stringify(result));
                      $uibModalInstance.dismiss('cancel');
                    };
                }
            }

            return $uibModal.open(tempModalDefaults).result;
        };

    }]);
