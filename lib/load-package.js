var path = require("path"),
    gulp = require("./gulp"),
    gutil = require("gulp-util"),
    fs = require("fs"),
    _ = require("lodash");

module.exports = function(dir, cb) {
    var merged = {};

    gulp.src(["node_modules/*/capitol.json", "!deploy/**/*", "capitol.json"], {cwd: dir})
    .pipe(gutil.buffer(function(err, files) {
        
        gutil.log("Configuration files:\n" + _.pluck(files, "path").join("\n"));

        var configs = _.map(files, function(file) {
            return JSON.parse(file.contents.toString());
        });

        var merged = {};

        var params = _([merged]).concat(configs).push(function(a, b) {
          return _.isArray(a) ? a.concat(b) : undefined;
        });

        _.merge.apply(_, params.value());

        cb(merged);
    }));
};