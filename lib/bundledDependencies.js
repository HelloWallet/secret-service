"use strict";

module.exports = function (packageFile, cb) {
    var fs = require("fs");
    var pkg = require(packageFile);

    var deps = [];
    if (pkg.bundleDeps !== false) {
        if (pkg.dependencies) {
            deps = deps.concat(Object.keys(pkg.dependencies));
        }
        pkg.bundledDependencies = deps;

        fs.writeFile(packageFile, JSON.stringify(pkg, null, 2), function (error) {
            if (error) {
                cb(error);
                return;
            }
            console.log("Package.json updated with the following bundled dependencies:");
            console.log(pkg.bundledDependencies);
            cb();
        });
    } else {
        cb();
    }
};
