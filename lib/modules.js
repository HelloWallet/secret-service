"use strict";

var gulp = require("./gulp"),
    path = require("path"),
    del = require("del"),
    child_process = require("child_process"),
    markBundledDependencies = require("./bundledDependencies"),
    debug = require("debug")("modules");


module.exports = function (cmd, opts, cb) {
    var cwd = opts && opts.path ? path.join(process.cwd(), opts.path) : process.cwd();
    var explodeModules = [];

    gulp.task("clean-modules", function () {
        debug("Cleaning ./.tmp and ./node_modules...");
        return del(["node_modules", ".tmp"]);
    });

    function runNpm(command, cb) {
        child_process.fork(path.join(__dirname, "/npm"), [JSON.stringify({
            cmd: command,
            opts: {
                uri: opts.uri
            },
            cwd: cwd
        })], {
            stdio: "inherit"
        }).on("close", function (code) {
            if (code !== 0) {
                cb(new Error("npm process exited with code " + code));
            }
            cb();
        });
    }

    gulp.task("build-modules", ["explode-modules"], function (cb) {
        if (explodeModules.length > 0) {
            runNpm("rebuild", cb);
        } else {
            debug("Skip rebuild. No modules exploded");
            cb();
        }
    });

    gulp.task("bundle-modules", function (cb) {
        var path = cwd;
        if (opts.package) {
            path += "/node_modules/" + opts.package;
        }
        path += "/package.json";

        markBundledDependencies(path, function (err) {
            if (err) {
                cb(err);
                return;
            }
            cb();
        });
    });

    gulp.task("pack-modules", ["bundle-modules"], function (cb) {
        if (opts.package) {
            process.chdir("./node_modules/" + opts.package);
        }
        runNpm("pack", cb);
    });

    gulp.task("publish-modules", ["bundle-modules"], function (cb) {
        runNpm("publish", cb);
    });

    gulp.task("install-modules", ["install-public-modules"], function (cb) {
        runNpm("install-private", cb);
    });

    gulp.task("install-public-modules", function (cb) {
        runNpm("install-public", cb);
    });

    if (cb) {
        cb(undefined, cmd + "-modules");
    }
};
