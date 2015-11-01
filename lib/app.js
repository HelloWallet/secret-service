"use strict";

var gulp = require("./gulp"),
    path = require("path"),
    glob = require("multi-glob").glob,
    loadPackage = require("./load-package"),
    appModules = path.join(process.cwd(), "./node_modules"),
    debug = require("debug")("app");

module.exports = function (cmd, opts, cb) {
    loadPackage(".", function (config) {
        glob(["tasks/ss*.js", appModules + "/*/tasks/ss*.js", appModules + "/@*/*/tasks/ss*.js"], function (err, files) {
            files.forEach(function (file) {
                debug("load module: ", file);
                require(path.resolve(process.cwd(), file))(gulp, config, opts);
            });
            cb(undefined, cmd);
        });
    });
};
