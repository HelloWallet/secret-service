var unzip = require("unzip"),
    fs = require("fs");

module.exports = {
	unzip: function(zipFileName, toDirectory, cb) {
		fs.createReadStream(zipFileName)
			.pipe(unzip.Extract({
				path: toDirectory
			}))
			.on("error", function(err) {
				console.error(err);
				cb(err);
			})
			.on("close", function() {
				cb();
			});
	},

	unzipEntry: function(zipFileName, entryFile, cb) {
		var entryFound = false;
		var stream = fs.createReadStream(zipFileName);
			
		stream.pipe(unzip.Parse())
			.on('entry', function(entry) {
				var fileName = entry.path;
				var type = entry.type; // 'Directory' or 'File'
				if (type === "File" && fileName === entryFile) {
					var buffers = [];
					entryFound = true;
					entry.on('data', function(buffer) {
						buffers.push(buffer);
					});
					entry.on('error', function(err) {
						cb(err);
					});
					entry.on('end', function() {
						var buffer = Buffer.concat(buffers);
						stream.unpipe();
						cb(undefined, buffer.toString("utf8"));
					});
				} else {
					entry.autodrain();
				}
			})
			.on("error", function(err) {
				console.error(err);
				cb(err);
			})
			.on("close", function() {
				if (!entryFound) {
					cb(new Error("file not found"));
				}
			});
	}
}