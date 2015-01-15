var gulp = require("gulp"),
    gutil = require("gulp-util")
    chalk = require("chalk");

["task_stop", "task_start", "task_err"].forEach(function(ev) {
    gulp.on(ev, function(msg) {
        gutil.log(chalk.bold(ev), msg.task + ":", chalk.magenta(msg.message));
    });
});

gulp.on('err', function(msg) {
    gutil.log(chalk.bold('err'), chalk.magenta(msg.message), msg.err, msg.err.stack);
});

gulp.chalk = chalk;
gulp.gutil = gutil;

gulp.ssMessage = function(msg) {
    gulp.gutil.log(gulp.chalk.bold(gulp.chalk.red(msg)));
}

module.exports = gulp;