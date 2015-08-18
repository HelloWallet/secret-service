var _ = require("lodash"),
    gulp = require("./gulp"),
    path = require("path"),
    Promise = require("bluebird"),
    glob = require("multi-glob").glob,
    loadPackage = require("./load-package"),
    appModules = path.join(process.cwd(), "./node_modules");

module.exports = function(cmd, opts, cb) {
    
    if (cmd === "tasks") {
        // load in the module tasks without running anything
        require("./modules")();

        loadPackage(".", function(config) {
            glob(["tasks/ss*.js", appModules + "/*/tasks/ss*.js"], function(err, files) {
                files.forEach(function(file) {
                    gulp.util.log("load module: ", file);
                    require(path.resolve(process.cwd(), file))(gulp, config, opts);    
                });                

                cb(undefined, ["help"]);
            });
        });
    } else if (cmd === "phases") {
        var config = require("./config.json");
        for(key in config) {
            if (_.endsWith(key, "-phases")) {
                console.log(gulp.gutil.colors.underline(key.replace("-phases", "")));
                console.log(config[key].join(", "));
                console.log("");
            }
        }
        cb();
    } else if (cmd === "deps") {
        require("npm").load(function(er, npm) {
            if (er) {
                cb(er);
                return;
            }
            npm.config.set("parseable", true);
            npm.config.set("depth", 1);
            npm.config.set("json", true);

            var stream = require('stream');
            var util = require('util');

            function EchoStream () { // step 2
              stream.Writable.call(this);
            };
            util.inherits(EchoStream, stream.Writable); // step 1
            EchoStream.prototype._write = function (chunk, encoding, done) { // step 3
              done();
            }

            var myStream = new EchoStream();
            npm.config.set("outfd", myStream);


            npm.commands.ls([], function(err, ls) {
                if (er) {
                    cb(er);
                    return;
                }

                var deps = ls.dependencies;
                function getDeps(list) {
                    return _(list).pairs().map(function(i) {
                        var vals = [];
                        if (i[1].dependencies) {
                            vals = getDeps(i[1].dependencies);
                        }
                        vals.push({ name: i[0], version: i[1].version });
                        return vals;
                    }).flatten().value();
                };

                Promise.all(getDeps(deps).map(function(d) {
                    return new Promise(function(resolve, reject) {
                        npm.commands.view([d.name], function(err, info) {
                            if (err) {
                                return reject(err);
                            }

                            resolve({
                                url: _.result(_.values(info)[0], "repository.url"),
                                homepage: _.result(_.values(info)[0], "homepage"),
                                latestVersion: _.keys(info)[0],
                                ourVersion: d.version
                            });
                        });
                    });
                })).then(function(depsInfo) {
                    var CliTable = require('cli-table');
                    var table = new CliTable({
                        head: ["URL", "Homepage", "Latest Version", "Our Version"],
                        colWidths: [40, 40, 20, 20]
                    });
                    var list = depsInfo.map(function(d) {
                        return [
                            d.url||"",
                            d.homepage||"",
                            d.latestVersion||"",
                            d.ourVersion||""
                        ];
                    });

                    table.push.apply(table, list);
                    console.log(table.toString());
                    cb();
                });
            });
        });
    }
}
