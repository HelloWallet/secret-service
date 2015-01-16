var _ = require("lodash"),
    gulp = require("./gulp"),
    gutil = require("gulp-util"),
    path = require("path"),
    glob = require("multi-glob").glob,
    loadPackage = require("./load-package"),
    appModules = path.join(process.cwd(), "./node_modules");

module.exports = function(opts, cb) {
    // load in the module tasks without running anything
    require("./modules")();

    loadPackage(".", function(config) {
        glob(["tasks/ss*.js", appModules + "/*/tasks/ss*.js"], function(err, files) {
            files.forEach(function(file) {
                gutil.log("load module: ", file);
                require(path.resolve(process.cwd(), file))(gulp, config, opts);    
            });                

            cb(undefined, ["help"]);
        });
    });
}
