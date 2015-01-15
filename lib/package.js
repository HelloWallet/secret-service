var _ = require("lodash"),
    path = require("path"),
    gutil = require("gulp-util"),
    chalk = require("chalk"),
    fs = require("fs"),
    gulp = require("./gulp"),
    del = require("del"),
    zip = require("gulp-zip"),
    es = require("event-stream"),
    glob = require("glob"),
    bump = require("gulp-bump"),
    runSequence = require("run-sequence").use(gulp),
    loadPackage = require("./load-package"),
    app = require("./app");

module.exports = function(opts, cb) {
    var cwd = opts.path?path.join(process.cwd(),opts.path):process.cwd();

    // load in the module tasks without running anything
    require("./modules")();

    //-----------------------------------
    // LOAD PACKAGE SETTINGS
    //-----------------------------------
    loadPackage(cwd, function(config) {
        //-----------------------------------
        // PACKAGE MODULES
        //-----------------------------------
        var appDestZip = "";
        var packageInclude;
        var packageBuildTarget = config.packageBuild;

        gulp.task('clean-app-package', function(cb) {
            del(path.join(cwd, "/deploy/") + "*.zip", cb);
        });

        gulp.task('version-increment', ['clean-app-package', "package-modules"], function() {
            var type = "patch";
            if (opts.bump === false) {
                return;
            } if (opts.major) {
                type = "major";
            } else if (opts.minor) {
                type = "minor";
            }

            return gulp.src("package.json", {cwd: cwd, base: cwd})
                .pipe(bump({type: type}))
                .pipe(gulp.dest("./"));
        });

        gulp.task('package', ['version-increment'], function() {
            return gulp.src(packageInclude, {cwd: cwd, base: cwd})
                .pipe(zip(appDestZip))
                .pipe(gulp.dest(path.join(cwd, "/deploy/")));
        });

        gulp.on('task_stop', function(msg) {
            if (msg.task == "build-prod") {
                process.nextTick(function() {
                    gulp.start("package");
                });
            } else if (msg.task === runCmd) {
                gulp.gutil.log(gulp.chalk.red("The eagle is in the nest."));
            }
        });

        // support detectign the default packaging type
        if (config.packageType === "library") {
            appDestZip = "lib.zip";
            runCmd = "package";
        } else {
            appDestZip = "app.zip";
            runCmd = "package";
        }

        if (packageBuildTarget) {
            var packageFile = require(cwd + "/package.json");

            gulp.task("build-and-package", function(cb) {
                require("./app")(true, "build-" + packageBuildTarget, opts, function() {
                    runSequence("build-" + packageBuildTarget, function() {
                        loadPackage(cwd, function(config) {
                            if (config.packageType === "library") {
                                packageInclude = config["lib-package"].include;
                            } else {
                                packageInclude = config.deployment.include;
                            }
                            packageInclude = packageInclude.concat(
                                _.keys(packageFile.dependencies).map(function(file) {
                                    return "modules/" + file + ".zip";
                                })
                            );
                            if (packageBuildTarget === "dev") {
                                packageInclude = packageInclude.concat(
                                    _.keys(packageFile.devDependencies).map(function(file) {
                                        return "modules/" + file + ".zip";
                                    })
                                );
                            }
                            console.log(packageInclude);                            
                            runSequence(runCmd, cb);
                        });
                    });
                });
            });
            if (cb) {
                cb(undefined, "build-and-package");
            }                
        } else {

            // support detectign the default packaging type
            if (config.packageType === "library") {
                packageInclude = config["lib-package"].include;
            } else {
                packageInclude = config.deployment.include;
            }            
            if (cb) {
                cb(undefined, runCmd);
            }
        }
    });
}