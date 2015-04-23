"use strict";
/* jshint browser: true */
var loader = require("capitol-dome/loader");
var min = (loader.getMeta("min") === "true");
var initialApp = (loader.getMeta("initialApp") || "application");

if (document.addEventListener) {
	loader("/js/libs" + (min ? ".min" : "") + ".js", "lib");
} else {
	loader("/js/libs_legacy" + (min ? ".min" : "") + ".js", "lib");
}
loader.ready("lib", function() {
	loader("/js/" + initialApp + (min ? ".min" : "") + ".js");
});