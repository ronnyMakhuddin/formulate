﻿//TODO: Disable buttons during configured form save.
// Variables.
var app = angular.module("umbraco");

// Associate directive/controller.
app.directive("formulateConfiguredFormDesigner", directive);
app.controller("formulate.configuredFormDesigner", controller);

// Directive.
function directive(formulateDirectives) {
    return {
        restrict: "E",
        template: formulateDirectives.get("configuredFormDesigner/designer.html"),
        controller: "formulate.configuredFormDesigner"
    };
}

// Controller.
function controller($scope, $routeParams, $route, formulateTrees,
    formulateConfiguredForms) {

    // Variables.
    var id = $routeParams.id;
    var isNew = id === "null";
    var parentId = $routeParams.under;
    var hasParent = !!parentId;
    var services = {
        formulateTrees: formulateTrees,
        formulateConfiguredForms: formulateConfiguredForms,
        $scope: $scope,
        $route: $route
    };

    // Set scope variables.
    $scope.isNew = isNew;
    $scope.conFormId = id;
    $scope.info = {
        conFormName: null,
        tabs: [
            {
                id: 20,
                active: true,
                label: "Configured Form",
                alias: "configuredForm"
            }
        ]
    };
    $scope.parentId = null;
    $scope.data = null;
    if (hasParent) {
        $scope.parentId = parentId;
    }

    // Set scope functions.
    $scope.save = getSaveConfiguredForm(services);
    $scope.canSave = getCanSave(services);

    // Initializes configured form.
    initializeConfiguredForm({
        id: id,
        isNew: isNew
    }, services);

    // Handle events.
    handleConfiguredFormMoves(services);

}

// Handles updating a configured form when it's moved.
function handleConfiguredFormMoves(services) {
    var $scope = services.$scope;
    $scope.$on("formulateEntityMoved", function(event, data) {
        var id = data.id;
        var newPath = data.path;
        if ($scope.conFormId === id) {

            // Store new path.
            $scope.conFormPath = newPath;

            // Activate in tree.
            services.formulateTrees.activateEntity(data);

        }
    });
}

// Saves the configured form.
function getSaveConfiguredForm(services) {
    return function () {

        // Variables.
        var $scope = services.$scope;
        var parentId = getParentId($scope);

        // Get configured form data.
        var conFormData = {
            parentId: parentId,
            conFormId: $scope.conFormId,
            name: $scope.info.conFormName,
            layoutId: $scope.layoutId,
            templateId: $scope.templateId
        };

        // Persist configured form on server.
        services.formulateConfiguredForms.persistConfiguredForm(conFormData)
            .then(function(responseData) {

                // Configured form is no longer new.
                var isNew = $scope.isNew;
                $scope.isNew = false;

                // Redirect or reload page.
                if (isNew) {
                    var url = "/formulate/formulate/editConfiguredForm/"
                        + responseData.conFormId;
                    services.$location.url(url);
                } else {

                    // Even existing configured forms reload (e.g., to get new data).
                    services.$route.reload();

                }

            });

    };
}

// Gets the ID path to the configured form.
function getConfiguredFormPath($scope) {
    var path = $scope.conFormPath;
    if (!path) {
        path = [];
    }
    return path;
}

// Gets the ID of the configured form's parent.
function getParentId($scope) {
    if ($scope.parentId) {
        return $scope.parentId;
    }
    var path = getConfiguredFormPath($scope);
    var parentId = path.length > 0
        ? path[path.length - 2]
        : null;
    return parentId;
}

// Initializes the configured form.
function initializeConfiguredForm(options, services) {

    // Variables.
    var id = options.id;
    var $scope = services.$scope;
    var isNew = options.isNew;

    // Is this a new configured form?
    if (isNew) {

        // The configured form can be saved now.
        $scope.initialized = true;

    } else {

        // Disable configured form saving until the data is populated.
        $scope.initialized = false;

        // Get the configured form info.
        services.formulateConfiguredForms.getConfiguredFormInfo(id)
            .then(function(conForm) {

                // Update tree.
                services.formulateTrees.activateEntity(conForm);

                // Set the configured form info.
                $scope.conFormId = conForm.conFormId;
                $scope.info.conFormName = conForm.name;
                $scope.conFormPath = conForm.path;
                $scope.layoutId = conForm.layoutId;
                $scope.templateId = conForm.layoutId;

                // The configured form can be saved now.
                $scope.initialized = true;

            });
    }

}

// Returns the function that indicates whether or not the configured form can be saved.
function getCanSave(services) {
    return function() {
        return services.$scope.initialized;
    };
}