var _ = require("lodash"),
    gulp = require("./gulp"),
    fs = require("fs"),
    path = require("path"),
    rename = require("gulp-rename"),
    del = require("del"),
    UnzipUtil = require("./unzip_util"),
    glob = require("glob"),
    async = require("async"),
    exec = require("child_process").exec,
    symlink = require("gulp-symlink"),
    mkdirp = require("mkdirp"),
    debug = require("debug")("deploy"),
    loadPackage = require("./load-package");

module.exports = function(opts, cb) {

    var baseDeployDir;
    var config = {};

    if (opts.destination) {
        baseDeployDir = path.resolve(process.cwd(), opts.destination);
    } else {
        baseDeployDir = path.join(process.cwd(), "./deploy");
    }

    var deploySource = path.join(baseDeployDir, "app.zip");

    mkdirp.sync(baseDeployDir);

    var d = new Date();
    var tsDirectory = "/deploy_" +
        d.getFullYear() + "_" +
        d.getMonth() + "_" +
        d.getDate() + "_" +
        (d.getHours()+1) + "_" +
        d.getMinutes() + "_" +
        d.getSeconds() +
        "/";
    var deployDestDir = path.join(baseDeployDir, tsDirectory);

    gulp.ssMessage("Deploy mission starting...");

    gulp.task("extract-app", function (cb) {
        UnzipUtil.unzip(deploySource, deployDestDir, cb);
    });

    gulp.task("explode-modules", ["extract-app"], function (cb) {
        var dir = path.join(deployDestDir, 'modules/*.zip');
        var modules = glob.sync(dir);

        var q = async.queue(function (file, cb) {
            var dir = path.join(file.base, path.basename(file.name, ".zip"));

            gulp.util.log("Extracting " + path.relative(process.cwd(), file.name) + " to " + path.relative(process.cwd(), dir));

            UnzipUtil.unzip(file.name, dir, function (err) {
                if (err) {
                    cb(err);
                }
                var modules = glob.sync(dir + "/modules/*.zip");
                if (modules.length > 0) {
                    debug("Adding dependent modules of " + file.name + " to the queue", modules);
                    q.push(_.map(modules, function (m) {
                        return { name: m, base: dir + "/node_modules"};
                    }));
                }
                cb();
            });
        }, 1);

        var baseLib = path.join(deployDestDir, "node_modules")
        q.push(_.map(modules, function (m) {
            return { name: m, base: baseLib}
        }));

        q.drain = function () {
            cb();
        }
    });

    gulp.task("loadPackageConfiguration", ["explode-modules"], function (cb) {
        loadPackage(deployDestDir, function (loadedConfig) {
            config = loadedConfig;
            cb();
        });
    });

    gulp.task("npm-rebuild", ["loadPackageConfiguration"], function (cb) {
        var npmExec = exec("npm rebuild", {cwd: deployDestDir}, function (err) {
            cb(err);
        });
        npmExec.stdout.pipe(process.stdout);
        npmExec.stderr.pipe(process.stderr);
    });

    gulp.task("clean-previous", function (cb) {
        var keep = ["previous", "current", "newest"];

        var logArray = function(msg, arr) {
            arr.forEach(function(item) {
                gulp.util.log(msg + " " + item + "...");
            });
            return arr;
        };

        del(logArray("Cleaning", [
            baseDeployDir + "/deploy_*"
        ]).concat(
            // log the list of things we are keeping
            logArray("Keeping",
                // take desired symlinks names and turn
                // them into paths
                keep.map(function(linkName) {
                    return path.join(baseDeployDir, "/", linkName);
                })
                // turn symlink path into the actual
                // directory name, returning undefined
                // for ones that don't exist
                .map(function(fullLink) {
                    try {
                        return fs.realpathSync(fullLink);
                    } catch (e) {
                        return undefined;
                    }
                })
                // remove undefineds
                .filter(function(path) {
                    return path !== undefined;
                })
            )
            // after logging these values, add an negation
            // for the glob pattern
            .map(function(path) {
                return "!" + path;
            })
        ), cb);
    });

    gulp.task("clean-newest", ["npm-rebuild"], function (cb) {
        del([baseDeployDir + "/newest"], cb);
    });

    gulp.task("symlink-newest", ["clean-newest"], function () {
        return gulp.src(deployDestDir)
            .pipe(symlink(baseDeployDir + "/newest", {force: true}));
    });

    gulp.task("deploy", ["symlink-newest", "clean-previous"]);

    gulp.on('task_stop', function (msg) {
        if (msg.task == "deploy") {
            gulp.util.log(gulp.colors.red("The eagle is in position."));
        }
    });

    cb(undefined, "deploy");
}