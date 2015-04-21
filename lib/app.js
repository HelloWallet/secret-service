var gulp = require("./gulp"),
    gutil = require("gulp-util"),
    runSequence = require("run-sequence").use(gulp),
    path = require("path"),
    DecompressZip = require('decompress-zip'),
    fs = require("fs"),
    _ = require("lodash"),
    rename = require("gulp-rename"),
    async = require("async"),
    glob = require("multi-glob").glob,
    filelog = require("gulp-filelog"),
    loadPackage = require("./load-package"),
    appModules = path.join(process.cwd(), "./node_modules"),
    debug = require("debug")("app"),
    ssConfig = require("./config.json");

module.exports = function(buildFilter, cmd, opts, cb) {
    // load in the module tasks without running anything
    require("./modules")(undefined, opts);

    function run() {
        loadPackage(".", function(config) {
            glob(["tasks/ss*.js", appModules + "/*/tasks/ss*.js"], function(err, files) {
                files.forEach(function(file) {
                    debug("load module: ", file);
                    require(path.resolve(process.cwd(), file))(gulp, config, opts);    
                });                

                var validTargets = [];
                if (config.build) {
                    _.forIn(config.build, function(phases, build) {
                        validTargets.push(build);
                        var steps = [];

                        _.forEach(ssConfig["build-phases"], function(phase) {
                            if (_.has(phases, phase) && _.uniq(phases[phase]).length > 0) {
                                steps.push(_.uniq(phases[phase]));
                            }
                        });

                        // gutil.log(build + ": ", steps);

                        gulp.task("build-" + build, function(cb) {
                            runSequence.apply(this, steps.concat([cb]));
                        });
                    });
                }

                var k = Object.keys(gulp.tasks).sort();

                if (opts.list === true) {
                    if (buildFilter) {
                        gutil.log("Valid build targets: " + validTargets.join(", "));
                    } else {
                        gutil.log("Available targets: " + k.join(", "));
                    }
                } else {
                    if (buildFilter) {
                        if (_.contains(validTargets, cmd)) {
                            opts.buildTarget = cmd;
                            cb(undefined, "build-" + cmd);
                        } else {
                            cb(new Error("Cannot find a valid build target for " + cmd));
                        }
                    } else {
                        cb(undefined, cmd);
                    }
                }

            });
        });
    }

    if (buildFilter && !opts.skipModules) {
        var modulePath = process.cwd();
        var installTask = "build-modules";

        if (fs.existsSync(modulePath + "/package.json")) {
            var packageFile = modulePath + "/package.json";
            try {
                var packageJson = JSON.parse(fs.readFileSync(packageFile));
                if (packageJson.repositoryInstall === true) {
                    installTask = "install-modules";
                    opts.uri = packageJson.privateRepository;
                }
            } catch (e) {
                gutil.log("Failed to process package file for " + packageFile);
            }
        }

        var moduleTasks;
        if (opts.cleanModules) {
            moduleTasks = ["clean-modules", installTask];
        } else {
            moduleTasks = [installTask];
        }

        runSequence(moduleTasks, function(err) {
            if (err) {
                gutil.log(err);
            } else {
                opts.buildTarget = cmd;
                run();
            }
        });
    } else {
        run();
    }
}
