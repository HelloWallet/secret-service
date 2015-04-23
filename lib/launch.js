var _ = require("lodash"),
    gulp = require("./gulp"),
    fs = require("fs"),
    path = require("path"),
    rename = require("gulp-rename"),
    del = require("del"),
    exec = require("child_process").exec,
    symlink = require("gulp-symlink"),
    loadPackage = require("./load-package"),
    mkdirp = require("mkdirp");

var deploySource = path.join("./deploy", "app.zip");
var deployDestDir = "./deploy/deploy" + new Date().getTime() + "/";
var config = {};

module.exports = function(cmd, opts, cb) {
    gulp.ssMessage("Launch mission starting...");

    var baseDeployDir;
    if (opts.destination) {
        baseDeployDir = path.resolve(process.cwd(), opts.destination);
    } else {
        baseDeployDir = path.join(process.cwd(), "./deploy");
    }

    var workers = opts.workerCount || 1;

    var newest = path.join(baseDeployDir, "/newest/");

    mkdirp.sync(baseDeployDir);

    loadPackage(newest, function(config) {

        gulp.task("keep-previous", function() {
            var realPath = fs.realpathSync(path.join(baseDeployDir, "/newest"));
            var currentPath;
            try {
                currentPath = fs.realpathSync(path.join(baseDeployDir, "/current"));
            } catch (e) {
                gulp.util.log("The current deployment directory doesn't exist");
                return;
            }
            if (currentPath === realPath) {
                gulp.util.log("The current deployment directory already matches the newest");
                return;
            } else {
                return gulp.src(currentPath, {base: "deploy"})
                    .pipe(symlink(baseDeployDir + "/previous", {force: true}));
            }
        });

        gulp.task("elevate-newest", ["keep-previous"], function() {
            var realPath = fs.realpathSync(path.join(baseDeployDir, "/newest"));
            var currentPath;
            try {
                currentPath = fs.realpathSync(path.join(baseDeployDir, "/current"));
            } catch (e) {
            }
            if (currentPath === realPath) {
                gulp.util.log("The current deployment directory already matches the newest");
                return;
            } else {
                return gulp.src(realPath, {base: "deploy"})
                    .pipe(symlink(baseDeployDir + "/current", {force: true}));
            }
        });

        gulp.task("start-server", ["elevate-newest"], function(cb) {
            var realPath = fs.realpathSync(path.join(baseDeployDir, "/current"));
            var cmd = "node " + path.join(__dirname, "../node_modules/naught/lib/main.js") +
                    " start" + 
                    " --cwd " + realPath +
                    " current/" + config.deployment.server +
                    " --worker-count " + workers;

            gulp.util.log("Starting naught with " + cmd);

            var naught = exec(cmd, {
                cwd: baseDeployDir,
                env: process.env
            }, function(err) {
                cb(err);
            });
            naught.stdout.pipe(process.stdout);
            naught.stderr.pipe(process.stderr);
        });

        gulp.task("redeploy-server", ["elevate-newest"], function(cb) {
            var realPath = fs.realpathSync(path.join(baseDeployDir, "/current"));
            var cmd = "node " + path.join(__dirname, "../node_modules/naught/lib/main.js") +
                " deploy --cwd " + realPath +
                " --worker-count " + workers;

            gulp.util.log("Deploying naught with " + cmd);

            var naught = exec(cmd, {
                cwd: baseDeployDir,
                env: process.env
            }, function(err) {
                cb(err);
            });
            naught.stdout.pipe(process.stdout);
            naught.stderr.pipe(process.stderr);
        });

        gulp.task("stop-server", function(cb) {
            var realPath = fs.realpathSync(path.join(baseDeployDir, "/current"));
            var cmd = "node " + path.join(__dirname, "../node_modules/naught/lib/main.js") +
                    " stop";

            gulp.util.log("Stopping naught with " + cmd);

            var naught = exec(cmd, {
                cwd: baseDeployDir,
                env: process.env
            }, function(err) {
                cb(err);
            });
            naught.stdout.pipe(process.stdout);
            naught.stderr.pipe(process.stderr);
        });

        gulp.task("start", ["start-server"]);
        gulp.task("redeploy", ["redeploy-server"]);
        gulp.task("stop", ["stop-server"]);

        gulp.on('task_stop', function(msg) {
            if (msg.task == "start" || msg.task == "redeploy") {
                gulp.ssMessage("The eagle has landed.");
            } else if (msg.task == "stop") {
                gulp.ssMessage("Mission aborted.");
            }
        });
        
        cb(undefined, cmd);
    });
}