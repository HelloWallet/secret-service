"use strict";

// Draw routes.  Locomotive"s router provides expressive syntax for drawing
// routes, including support for resourceful routes, namespaces, and nesting.
// MVC routes can be mapped mapped to controllers using convenient
// `controller#action` shorthand.  Standard middleware in the form of
// `function(req, res, next)` is also fully supported.  Consult the Locomotive
// Guide on [routing](http://locomotivejs.org/guide/routing.html) for additional
// information.

var capitol = require("capitol-core"),
    pressCorp = require("press-corp"),
    config = capitol.config,
    passport = capitol.authentication.passport,
    path = require("path");

module.exports = function routes() {
    var clientErrorLogger = capitol.logger.getNamedLogger("client");
    var isDev = config.get("env") === "development";
    var jsDir = path.join(__dirname, "../", config.get("app:staticFiles"), "js/");

    this.post("/error", pressCorp.error({
        srcUrl: jsDir,
        logger: clientErrorLogger,
        src: capitol.config.get("server:errorHandlerEnabled") ? [
            {
                src: (isDev ? "application.js" : "application.min.js"),
                map: (isDev ? "application.js.map" : "application.js.min.map")
            },
            {
                src: (isDev ? "libs.js" : "libs.min.js"),
                map: (isDev ? "libs.js.map" : "libs.js.min.map")
            }
        ] : [ ]
    }));

    this.post("/log", pressCorp.log({
        logger: clientErrorLogger
    }));

    this.root("pages#main");
    this.match("error", "error#main");
    this.match("sessionExpired", "error#session");
    
    if (config.get("sso:jumpPage:enabled") === true) {
        this.match("jumpPage", "jumpPage#main");
    }

    this.match("sso",
        passport.authenticate("sso", {
            successReturnToOrRedirect: "/",
            failureRedirect: config.get("sso:jumpPage:enabled") ? "/jumpPage" : "/error",
            failureFlash: true
        }), {
        via: "post"
    });

    /*
        Routing configured with capitol so we can
        support API docs.
     */
    var routing = capitol.RouteManager.register(this);
    routing.resources("participants", {only: ["update"]});
    routing.resources("strategies");
    routing.resources("revisedStrategies");
    routing.resources("fundLineups");
    routing.resources("programFees");
    routing.resources("enrollments", {only: ["create"]});
    routing.resources("cancelServices", {only: ["create","update"]});

    routing.resources("securitySearch");
    routing.resources("status");
};
