module.exports = function() {
	process.on("notify", function(msg) {
	    require("node-notifier").notify({
	        "title": "Secret Service",
	        "message": msg
	    });
	});
	process.on("title", function(title) {
		var setTerminalTitle = require("set-terminal-title");
		setTerminalTitle(title);
	});
}