var gulp = require("gulp"),
    help = require("gulp-help"),
    gutil = require("gulp-util");

help(gulp, { 
    description: "This task is what makes the 'tasks' command work"
});

["task_stop", "task_start", "task_err"].forEach(function(ev) {
    gulp.on(ev, function(msg) {
        gutil.log(gutil.colors.bold(ev), 
        	msg.task + ":", 
        	gutil.colors.magenta(msg.message));
    });
});

gulp.on('err', function(msg) {
    gutil.log(
    	gutil.colors.bold('err'), 
    	gutil.colors.magenta(msg.message), 
    	msg.err, msg.err.stack);
});

gulp.gutil = gutil;
gulp.util = gutil;
gulp.colors = gulp.chalk = gutil.colors;

gulp.ssMessage = function(msg) {
    gulp.gutil.log(gulp.colors.bold(gulp.colors.red(msg)));
}

module.exports = gulp;