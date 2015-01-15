// Creates a fresh project with Capitol

// unzip packaged versions of capitol, capitol-dome
// create assets dir
// - create bootstrap base files
// - create basic content file
// decide what to do with bower files

var gulp = require("./gulp"),
    path = require("path"),
    shell = require("gulp-shell"),
    exec = require("child_process").exec,
    async = require("async"),
    DecompressZip = require('decompress-zip'),
    baseDir = path.dirname(require.main.filename);

module.exports = function(target) {
    gulp.ssMessage("Creating new secret mission " + target);

    gulp.task("copy-scaffold", function() {
        return gulp.src(path.join(baseDir, "/base/**/*"), {base: path.join(baseDir, "/base/")})
          .pipe(gulp.dest(target));
    });

    gulp.task("extract-frameworks", function(cb) {
        var frameworkDir = path.join(baseDir, "/frameworks/");

        var unzip = function(src, dest) {
            return function(unzipCb) {
                gulp.gutil.log("unzipping " + src);

                var ex = new DecompressZip(src);
                ex.on("extract", function() { unzipCb(); });
                ex.extract({path: dest});
            }
        }

        async.series([
            unzip(frameworkDir + "capitol.zip", target + "/node_modules/capitol"),
            unzip(frameworkDir + "capitol-dome.zip", target + "/node_modules/capitol-dome"),
            unzip(target + "/node_modules/capitol/node_modules.zip", target + "/node_modules/capitol"),
            unzip(target + "/node_modules/capitol-dome/node_modules.zip", target + "/node_modules/capitol-dome")
        ], cb);
    });  

    gulp.task("npm-rebuild", ["extract-frameworks"], function(cb) {
        exec("npm rebuild", {maxBuffer: 10000*1024}, function(err, stdout, stderr) {
            console.log(stdout);
            console.error(stderr);
            cb(err);
        });
    });

    gulp.task("init", ["copy-scaffold", "npm-rebuild"]);

    gulp.on('task_stop', function(msg) {
        if (msg.task == "init") {
            gulp.ssMessage("Ready to start your mission.");
        }
    });

    gulp.start("init")
}