var _ = require("lodash"),
    gulp = require("./gulp"),
    gutil = require("gulp-util"),
    fs = require("fs"),
    path = require("path"),
    rename = require("gulp-rename"),
    del = require("del"),
    DecompressZip = require('decompress-zip'),
    glob = require("glob"),
    async = require("async"),
    exec = require("child_process").exec,
    shell = require("gulp-shell"),
    symlink = require("gulp-symlink"),
    mkdirp = require("mkdirp"),
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
        var ex = new DecompressZip(deploySource);
        ex.on("extract", function () {
            cb();
        });
        ex.extract({path: deployDestDir });
    });

    gulp.task("explode-modules", ["extract-app"], function (cb) {
        var dir = path.join(deployDestDir, 'modules/*.zip');
        var modules = glob.sync(dir);

        var q = async.queue(function (file, callback) {
            var dir = path.join(file.base, path.basename(file.name, ".zip"));
            var ex = new DecompressZip(file.name);

            gutil.log("Extracting " + file.name + " to " + dir);

            ex.on("extract", function () {

                var modules = glob.sync(dir + "/modules/*.zip");
                if (modules.length > 0) {
                    q.push(_.map(modules, function (m) {
                        return { name: m, base: dir + "/node_modules"};
                    }));
                }

                callback();
            });
            ex.extract({path: dir });
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
        exec("npm rebuild", {cwd: deployDestDir, maxBuffer: 10000 * 1024}, function (err, stdout, stderr) {
            console.log(stdout);
            console.error(stderr);
            cb(err);
        });
    });

    gulp.task("clean-newest", ["npm-rebuild"], function (cb) {
        del([baseDeployDir + "/newest"], cb);
    });

    gulp.task("symlink-newest", ["clean-newest"], function () {
        return gulp.src(deployDestDir)
            .pipe(symlink(baseDeployDir, "newest"));
    });

    gulp.task("deploy", ["symlink-newest"]);

    gulp.on('task_stop', function (msg) {
        if (msg.task == "deploy") {
            gulp.gutil.log(gulp.colors.red("The eagle is in position."));
        }
    });

    cb(undefined, "deploy");
}