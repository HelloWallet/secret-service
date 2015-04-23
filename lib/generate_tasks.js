var _ = require("lodash"),
	gulp = require("./gulp"),
	ssConfig = require("./config.json");

module.exports = function(config, phaseType) {
	if (config) {
		var validTargets = [];

	    _.forIn(config, function(phases, build) {
	        validTargets.push(build);
	        var steps = [];

	        _.forEach(ssConfig[phaseType + "-phases"], function(phase) {
	            if (_.has(phases, phase) && _.uniq(phases[phase]).length > 0) {
	                steps.push(_.uniq(phases[phase]));
	            }
	        });

	        gulp.task(phaseType + "-steps-" + build, function(cb) {
	            gulp.runSequence.apply(this, steps.concat([cb]));
	        });
	    });

	    return validTargets;
	}
};