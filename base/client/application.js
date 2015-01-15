"use strict";

/*jslint browser:true */

var App = window.App = require("capitol-dome").App;
var Ember = require("ember");
require("../public/js/templates");

App.ApplicationRoute = require("./routes/application_route");

App.Router.map(function() {
    this.route("dashboard");
    this.route("about");
});