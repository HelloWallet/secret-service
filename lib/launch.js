var _ = require("lodash"),
    gulp = require("./gulp"),
    gutil = require("gulp-util"),
    chalk = require("chalk"),
    fs = require("fs"),
    path = require("path"),
    rename = require("gulp-rename"),
    del = require("del"),
    DecompressZip = require('decompress-zip'),
    exec = require("child_process").exec,
    shell = require("gulp-shell"),
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
        gulp.task("clean-current", function(cb) {
            del(path.join(baseDeployDir, "current"), cb);
        });

        gulp.task("elevate-newest", ["clean-current"], function() {
            var realPath = fs.readlinkSync(path.join(baseDeployDir, "/newest"));
            return gulp.src(realPath, {base: "deploy"})
                .pipe(symlink(baseDeployDir, "current"));
        });

        gulp.task("start-server", ["elevate-newest"], function() {
            var realPath = fs.readlinkSync(path.join(baseDeployDir, "/current"));
            var cmd = "node " + path.join(__dirname, "../node_modules/naught/lib/main.js") +
                    " start" + 
                    " --cwd " + realPath +
                    " current/" + config.deployment.server +
                    " --worker-count " + workers;

            gutil.log("Starting naught with " + cmd);

            exec(cmd, {
                cwd: baseDeployDir,
                env: process.env,
                maxBuffer: 10000*1024
            }, function(err, stdout, stderr) {
                console.log(stdout);
                console.error(stderr);
                cb(err);
            });
        });

        gulp.task("redeploy-server", ["elevate-newest"], function() {
            var realPath = fs.readlinkSync(path.join(baseDeployDir, "/current"));
            var cmd = "node " + path.join(__dirname, "../node_modules/naught/lib/main.js") +
                " deploy --cwd " + realPath +
                " --worker-count " + workers;

            gutil.log("Deploying naught with " + cmd);

            return gulp.src("")
                .pipe(exec(cmd, { 
                    execOpts: {
                        cwd: baseDeployDir,
                        env: process.env
                    }
                } ));
        });

        gulp.task("stop-server", function() {
            var realPath = fs.readlinkSync(path.join(baseDeployDir, "/current"));
            var cmd = "node " + path.join(__dirname, "../node_modules/naught/lib/main.js") +
                    " stop";

            gutil.log("Stopping naught with " + cmd);

            return gulp.src("")
                .pipe(exec(cmd, { 
                    execOpts: {
                        cwd: baseDeployDir,
                        env: process.env
                    }
                } ));
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