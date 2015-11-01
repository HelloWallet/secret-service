"use strict";
// Creates a fresh project with Capitol

// unzip packaged versions of capitol, capitol-dome
// create assets dir
// - create bootstrap base files
// - create basic content file
// decide what to do with bower files

var gulp = require("./gulp");
var path = require("path");
var template = require("gulp-template");
var debug = require("debug")("init");
var config = require("./config.json");

module.exports = function (target) {
    var localTmpDir;
    var localSampleAppPath;

    gulp.ssMessage("Creating new secret mission " + target);

    gulp.task("download-sample", function () {
        var tmp = require("tmp");
        var NodeGit = require("nodegit");
        var cloneURL = config.initProjectUrl;
        localTmpDir = tmp.dirSync();
        localSampleAppPath = localTmpDir.name;
        return NodeGit.Clone(cloneURL, localSampleAppPath);
    });

    gulp.task("copy-sample", ["download-sample"], function () {
        debug("Temporary directory: " + localSampleAppPath);
        return gulp.src([
            path.join(localSampleAppPath, "/**/*"),
            path.join(localSampleAppPath, "/**/.npmrc")
        ], {
            base: localSampleAppPath
        })
        // .pipe(template({
        //     packageName: target
        // }))
        .pipe(gulp.dest(target));
    });

    gulp.task("cleanup-sample", ["copy-sample"], function () {
        return require("del")(path.join(localSampleAppPath, "/*"), {
            dot: true, force: true
        }).then(function () {
            localTmpDir.removeCallback();
        });
    });

    /* don't run this right now, probably should run a build for them instead */
    gulp.task("install-init", ["copy-scaffold"], function (cb) {
        require("./modules")("install", {
            path: "./" + target
        }, function (err, taskName) {
            gulp.start(taskName);
        });
    });

    gulp.task("init", ["cleanup-sample"]);

    gulp.on("task_stop", function (msg) {
        if (msg.task == "init") {
            gulp.util.log("Go into './" + target + "', and run:");
            gulp.util.log(" > secret-service build dev");
            gulp.util.log(" > secret-service server local");
            gulp.ssMessage("Ready to start your mission.");
        }
    });

    gulp.start("init");
};
