var path = require("path"),
    gulp = require("./gulp"),
    fs = require("fs"),
    debug = require("debug")("load-package"),
    _ = require("lodash");

module.exports = function(dir, cb) {
    var merged = {};
    debug("Loading " + dir + "/package.json" + " package file");

    var currentAppPackage = JSON.parse(fs.readFileSync(dir + "/package.json"));
    var appConfig = currentAppPackage["secret-service"];

    gulp.src(["node_modules/*/capitol.json", "capitol.json"], {cwd: dir})
    .pipe(gulp.util.buffer(function(err, files) {
        
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