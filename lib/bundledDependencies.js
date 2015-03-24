'use strict';

module.exports = function(packageFile, cb) {
    var fs = require('fs');
    var pkg = require(packageFile);

    var deps = [];
    if (pkg.dependencies) {
        deps = deps.concat(Object.keys(pkg.dependencies));
    }
    if (pkg.devDependencies) {
        deps = deps.concat(Object.keys(pkg.devDependencies));
    }

    pkg.bundledDependencies = deps;

    fs.writeFile(packageFile, JSON.stringify(pkg, null, 4), function(error) {
        if (error) {
            cb(error);
            return;
        }
        console.log('Package.json updated with the following bundled dependencies:');
        console.log(pkg.bundledDependencies);
        cb();
    });
};