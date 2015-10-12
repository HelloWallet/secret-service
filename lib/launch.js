var _ = require("lodash"),
    gulp = require("./gulp"),
    fs = require("fs"),
    path = require("path"),
    rename = require("gulp-rename"),
    template = require("gulp-template"),
    del = require("del"),
    spawn = require("child_process").spawn,
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
    gulp.on('task_stop', function(msg) {
        if (msg.task == "start" || msg.task == "redeploy") {
            gulp.ssMessage("The eagle has landed.");
        } else if (msg.task == "stop") {
            gulp.ssMessage("Mission aborted.");
        }
    });

    if (cmd === "init") {
        gulp.task("init-server", function(cb) {
            var env = opts.env;
            return gulp.src(path.join(__dirname, "/../scripts/initd-" + env + ".sh"))
                .pipe(template({
                    appDir: opts.destination
                }))
                .pipe(rename(opts.name))
                .pipe(gulp.dest('/etc/init.d/'));
        });
        cb(undefined, "init-server");
    } else {
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

            function launch(deployCmd, cb) {
                var realPath = fs.realpathSync(path.join(baseDeployDir, "/current"));
                var cmd = "node";
                var args = [
                    path.join(__dirname, "../node_modules/naught/lib/main.js"),
                    deployCmd
                ];
                args = args.concat([
                    "--cwd",
                    realPath,
                    "--worker-count",
                    workers
                ]);
                if (config.deployment.master && config.deployment.masterProcessEnabled) {
                    args.push("--master");
                    args.push("current/" + config.deployment.master);
                }
                if (deployCmd === "start") {
                    args = args.concat([
                        "--remove-old-ipc",
                        "true",
                        "current/" + config.deployment.server
                    ]);
                }

                gulp.util.log("Starting naught with " + cmd + " " + args.join(" "));
                gulp.util.log("from " + baseDeployDir);

                var proc = spawn(cmd, args, {
                    cwd: baseDeployDir,
                    stdio: "inherit"
                });
                proc.on("close", function(code) {
                    if (code !== 0) {
                        cb(new Error("Start process exited with code " + code));
                        return;
                    }
                    cb();
                });
            }

            function check(checkCmd, cb) {
                var cmd = "node";
                var args = [
                    path.join(__dirname, "../node_modules/naught/lib/main.js"),
                    checkCmd
                ];
                if (checkCmd === "stop") {
                    args = args.concat([
                        "--timeout",
                        "5"
                    ]);
                }

                var proc = spawn(cmd, args, {
                    cwd: baseDeployDir,
                    stdio: "inherit"
                });
                proc.on("close", function(code) {
                    if (code !== 0) {
                        cb(new Error("Process exited with code " + code));
                        return;
                    }
                    cb();
                });
            }

            gulp.task("local-server", ["elevate-newest"], function(cb) {
                launch("start", cb);
            });

            gulp.task("start-server", ["elevate-newest"], function(cb) {
                launch("start", cb);
            });

            gulp.task("redeploy-server", ["elevate-newest"], function(cb) {
                check("status", function(err) {
                    if (err) {
                        launch("start", cb);
                    } else {
                        launch("deploy", cb);
                    }
                });
            });

            gulp.task("stop-server", function(cb) {
                check("stop", cb);
            });

            gulp.task("status-server", function(cb) {
                check("status", cb);
            });

            cb(undefined, cmd + "-server");
        });
    }
};
