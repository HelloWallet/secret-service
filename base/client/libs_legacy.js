"use strict";
/* jshint browser: true */
require("capitol-dome/lib/libsLegacy");
require("capitol-dome").init({
    Types: require("capitol-types")
});

window.require = function(x) {
    var exports = {
        "capitol-dome": require("capitol-dome"),
        "capitol-types": require("capitol-types")
    };
    return exports[x];
};
