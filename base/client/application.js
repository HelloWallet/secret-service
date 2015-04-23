"use strict";

/*jslint browser:true */

var App = window.App = module.exports = require("capitol-dome").createApplication("App");

require("../public/js/templates");
App.ApplicationRoute = require("./routes/application_route");

App.Router.map(function() {
    this.route("dashboard");
    this.route("about");
});

App.advanceReadiness();