// Creates a fresh project with Capitol

// unzip packaged versions of capitol, capitol-dome
// create assets dir
// - create bootstrap base files
// - create basic content file
// decide what to do with bower files

var gulp = require("./gulp"),
    gulpRunner = require("./gulp_runner"),
    path = require("path"),
    exec = require("child_process").exec,
    async = require("async"),
    template = require("gulp-template"),
    baseDir = path.dirname(require.main.filename);

module.exports = function(target) {
    gulp.ssMessage("Creating new secret mission " + target);

    gulp.task("copy-scaffold", function() {
        return gulp.src(path.join(baseDir, "/base/**/*"), {base: path.join(baseDir, "/base/")})
            .pipe(template({
                packageName: "test"
            }))
            .pipe(gulp.dest(target));
    });

    gulp.task("install-init", ["copy-scaffold"], function(cb) {
        require("./modules")("install", {
            path: "./" + target
        }, function(err, taskName) {
            gulp.start(taskName);
        });
    });

    gulp.task("init", ["install-init"]);

    gulp.on('task_stop', function(msg) {
        if (msg.task == "init") {
            gulp.ssMessage("Ready to start your mission.");
        }
    });

    gulp.start("init")
}