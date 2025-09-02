// This file will compiled into the application's javascript code.
// Currently it provides an example of how to register a custom system that can run logic based on page updates

// Wrapping all the code in an immediately invoked anonymous function will ensure that there's no conflict in global space
(function () {
    var customSystem = {};

    /**
     * Required method. must return a unique system name
     * If customSystem.availableToGlobal returns true, then customSystem will be available at
     * gw.globals[return value of this method]
     * @returns {string}
     */
    customSystem.getSystemName = function () {
        return "myCustomSystemInCustomerJs"; // This name needs to be unique across all Guidewire and custom systems
    };

    /**
     * Optional method. If defined, will be called on every page update
     * @param isFullPageReload: boolean - true if the page has been completely reloaded
     */
    customSystem.init = function (isFullPageReload) {
        if (isFullPageReload) {
            // Run logic here only when the entire page has been reloaded
            // Possibly execute special code, like reconnecting to an external service or API
        }

        // Run logic here to execute anytime the page partially updates
    };

    /**
     * Optional method, which will place the customSystem object on gw.globals.myCustomSystemInCustomerJs if the return value is true
     * @returns {boolean}
     */
    customSystem.availableToGlobal = function () {
        return false;
    };

    gw.api.registerGlobalSystem(customSystem);
})();
