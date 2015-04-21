var path = require("path"),
    gulp = require("./gulp"),
    gutil = require("gulp-util"),
    fs = require("fs"),
    debug = require("debug")("load-package"),
    _ = require("lodash");

module.exports = function(dir, cb) {
    var merged = {};

    var currentAppPackage = JSON.parse(fs.readFileSync(process.cwd() + "/package.json"));
    var appConfig = currentAppPackage["secret-service"];

    gulp.src(["node_modules/*/capitol.json", "!deploy/**/*", "capitol.json"], {cwd: dir})
    .pipe(gutil.buffer(function(err, files) {
        
        debug("Configuration files:\n" + _.pluck(files, "path").join("\n"));

        var configs = _.map(files, function(file) {
            return JSON.parse(file.contents.toString());
        });
        if (appConfig !== undefined) {
            configs.push(appConfig);
        }

        var merged = {};

        var params = _([merged]).concat(configs).push(function(a, b) {
          return _.isArray(a) ? a.concat(b) : undefined;
        });

        _.merge.apply(_, params.value());

        cb(merged);
    }));
};