"use strict";

var _ = require("lodash"),
    gulp = require("./gulp");

module.exports = function (opts, cb) {
    var config = require("./config.json");
    for (var key in config) {
        if (_.endsWith(key, "-phases")) {
            console.log(gulp.gutil.colors.underline(key.replace("-phases", "")));
            console.log(config[key].join(", "));
            console.log("");
        }
    }
    cb();
};
