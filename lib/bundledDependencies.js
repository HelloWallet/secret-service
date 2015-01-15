'use strict';

module.exports = function(packageFile) {
  var fs = require('fs');
  var pkg = require(packageFile);

  var deps = Object.keys(pkg.dependencies);
  if (pkg.devDependencies) {
    deps = deps.concat(Object.keys(pkg.devDependencies));
  }

  pkg.bundledDependencies = deps;

  fs.writeFile(packageFile, JSON.stringify(pkg, null, 4), function(error) {
    if (error) {
      throw error;
    }
    console.log('Package.json updated with the following bundled dependencies:');
    console.log(pkg.bundledDependencies);
  });
};
