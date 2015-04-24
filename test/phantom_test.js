var page = require('webpage').create();
page.open('http://localhost:3005', function(status) {
	var errs = [];
	console.log("Status: " + status);
	if (status === "success") {
		page.evaluateAsync(function() {
			setTimeout(function() {
				window.callPhantom({
					title: document.title,
					app: document.body.querySelector("#Application").innerText
				});
			}, 2000);
		});
		page.onResourceRequested = function(requestData, networkRequest) {
		  console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
		};
		page.onCallback = function(data) {
			console.log(data.app);
			console.log('Page title is ' + data.title);
			if (data.title !== "Retirement Manager") {
				errs.push(new Error("Page matches"));
			}
			if (data.app !== "My Ember App") {
				errs.push(new Error("Page matches"));
			}
			if (errs.length > 0) {
				console.log("ERRORS:", errs);
			}
			phantom.exit(errs.length);
		};
	}
});