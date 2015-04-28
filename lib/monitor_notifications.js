module.exports = function() {
	process.on("notify", function(msg) {
	    require("node-notifier").notify({
	        "title": "Secret Service",
	        "message": msg
	    });
	});
}