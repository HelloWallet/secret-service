var gulp = require("./gulp"),
    runSequence = require("run-sequence").use(gulp);

// add sequenced functionality to gulp
gulp.runSequence = runSequence;

module.exports = function(err, runCmd) {
    if (err) {
        gulp.util.log(err);
        return;
    }

    gulp.on("task_err", function(e) {
        if (e.err && e.err.stack) {
            gulp.util.log(e.err.stack);
        } else {
            gulp.util.log(e.err);
        }
        process.exit(1);
    });

    gulp.on("task_end", function(name) {
        gulp.util.log("Task ended " + name);
    });

    if (Array.isArray(runCmd)) {
        runSequence.apply(this, runCmd);
    } else if (typeof runCmd === "string") {
        runSequence(runCmd);
    }
};