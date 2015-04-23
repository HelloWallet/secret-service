var _ = require("lodash"),
	gulp = require("./gulp"),
	fs = require("fs"),
	generateTasks = require("./generate_tasks"),
	loadPackage = require("./load-package");

module.exports = function(cmd, opts, cb) {
	// load in the module tasks without running anything
    require("./modules")(undefined, opts);

	function runBuild() {
		loadPackage(".", function(config) {
			var validTargets = generateTasks(config.build, "build");
			if (opts.list === true) {
		        gulp.util.log("Valid build targets: " + validTargets.join(", "));
			} else {
		        if (_.contains(validTargets, cmd)) {
		            opts.buildTarget = cmd;
		            require("./app")("build-steps-" + cmd, opts, cb);
		        } else {
		            cb(new Error("Cannot find a valid build target for " + cmd));
		        }
			}
		});
	}

	if (!opts.skipModules) {
	    var modulePath = process.cwd();
	    var installTask = "build-modules";

	    if (fs.existsSync(modulePath + "/package.json")) {
	        var packageFile = modulePath + "/package.json";
	        try {
	            var packageJson = JSON.parse(fs.readFileSync(packageFile));
	            if (packageJson.repositoryInstall === true) {
	                installTask = "install-modules";
	                opts.uri = packageJson.privateRepository;
	            }
	        } catch (e) {
	            gulp.util.log("Failed to process package file for " + packageFile);
	        }
	    }

	    var moduleTasks;
	    if (opts.cleanModules) {
	        moduleTasks = ["clean-modules", installTask];
	    } else {
	        moduleTasks = [installTask];
	    }

	    gulp.runSequence(moduleTasks, function(err) {
	        if (err) {
	            gulp.util.log(err);
	        } else {
	            runBuild();
	        }
	    });
	} else {
		runBuild();
	}
}