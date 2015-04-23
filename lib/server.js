var gulp = require("./gulp"),
    runSequence = require("run-sequence").use(gulp),
    path = require("path"),
    fs = require("fs"),
    _ = require("lodash"),
    rename = require("gulp-rename"),
    async = require("async"),
    debug = require("debug")("server"),
    glob = require("multi-glob").glob,
    loadPackage = require("./load-package"),
    appModules = path.join(process.cwd(), "./node_modules"),
    ssConfig = require("./config.json");

function buildTaskSets(taskPreFix, tasks, possiblePhases) {
    var validTargets = [];
    if (tasks) {
        _.forIn(tasks, function(phases, task) {
            validTargets.push(task);
            var steps = [];

            _.forEach(possiblePhases, function(phase) {
                if (_.has(phases, phase)) {
                    steps.push(_.cloneDeep(phases[phase]));
                }
            });

            debug(taskPreFix + ":" + task + ": ", steps);

            gulp.task(taskPreFix + task, function(cb) {
                runSequence.apply(this, _.cloneDeep(steps).concat([cb]));
            });
        });
    }
    return validTargets;
}

module.exports = function(cmd, opts, cb) {
    // load in the module tasks without running anything
    require("./modules")();

    function run() {
        loadPackage(".", function(config) {
            glob(["tasks/ss*.js", appModules + "/*/tasks/ss*.js"], function(err, files) {
                files.forEach(function(file) {
                    debug("load module: ", file);
                    require(path.resolve(process.cwd(), file))(gulp, config, opts);    
                });                


                debug(config.launch)

                var validTargets = buildTaskSets(
                    "launch-server-",
                    config.launch,
                    ssConfig["launch-phases"]
                );

                buildTaskSets(
                    "launch-restart-server-", 
                    config.launch, 
                    ssConfig["launch-restart-phases"]
                );

                var k = Object.keys(gulp.tasks).sort();
                debug("Valid launch targets: " + validTargets.join(", "));

                if (opts.list === true) {
                    gulp.util.log("Valid launch targets: " + validTargets.join(", "));
                } else {
                    if (_.contains(validTargets, cmd)) {
                        process.on("restart-launch-server", function() {
                            gulp.start("launch-restart-server-" + cmd);
                        });
                        cb(undefined, "launch-server-" + cmd);
                    } else {
                        cb(new Error("Cannot find a valid server target for " + cmd));
                    }
                }

            });
        });
    }

    run();
}
