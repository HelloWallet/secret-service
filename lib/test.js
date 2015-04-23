var _ = require("lodash"),
	gulp = require("./gulp"),
	fs = require("fs"),
	generateTasks = require("./generate_tasks"),
	loadPackage = require("./load-package");

module.exports = function(cmd, opts, cb) {
	// load in the module tasks without running anything
    require("./modules")(undefined, opts);

	loadPackage(".", function(config) {
		var validTargets = generateTasks(config.test, "test");
		if (opts.list === true) {
	        gulp.util.log("Valid test targets: " + validTargets.join(", "));
		} else {
	        if (_.contains(validTargets, cmd)) {
	            opts.buildTarget = cmd;
	            require("./app")("test-steps-" + cmd, opts, cb);
	        } else {
	            cb(new Error("Cannot find a valid test target for " + cmd));
	        }
		}
	});
};