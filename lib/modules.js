var gulp = require("./gulp"),
    gutil = require("gulp-util"),
    path = require("path"),
    fs = require("fs"),
    DecompressZip = require('decompress-zip'),
    _ = require("lodash"),
    rename = require("gulp-rename"),
    del = require("del"),
    async = require("async"),
    zip = require("gulp-zip"),
    es = require("event-stream"),
    glob = require("multi-glob"),
    exec = require("child_process").exec,
    spawn = require("child_process").spawn,
    semver = require("semver"),
    Table = require('cli-table');

module.exports = function(cmd, opts, cb) {
    var cwd = opts && opts.path ? path.join(process.cwd(), opts.path) : process.cwd();
    var versions = {};
    var explodeModules = [];

    gulp.task("clean-modules", function(cb) {
        gutil.log("Cleaning node_modules...");
        del(["node_modules"], cb);
    });

    gulp.task("bundle-modules", function(cb) {
        require("./bundledDependencies")(path.join(process.cwd(), "./package.json"));
    });

    gulp.task("check-modules", "Use 'ss modules check' command. Internal command that checks packaged versions vs. requirements vs. extracted versions", function(cb) {
        var dir = "./.tmp";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        var packages = opts && opts.package || "*";

        glob.glob('modules/' + packages + '.zip', function(err, modules) {
            var projPackageJSON =
                JSON.parse(fs.readFileSync("./package.json")),
                deps = _.merge({},
                    projPackageJSON.dependencies,
                    projPackageJSON.devDependencies
                );

            _.forOwn(deps, function(ver, name) {
                versions[name] = {
                    reqVersion: ver,
                    required: true
                };
                var installedPath =
                    "node_modules/" + name + "/package.json";
                if (fs.existsSync(installedPath)) {
                    var depPackageJSON =
                        JSON.parse(fs.readFileSync(installedPath));
                    _.merge(versions[name], {
                        installedVersion: depPackageJSON.version
                    });
                }
            });

            var q = async.queue(function(file, callback) {
                var dir = path.join(".tmp", path.basename(file.name, ".zip")) + "/";
                var ex = new DecompressZip(file.name);

                ex.on("extract", function() {
                    var package = JSON.parse(fs.readFileSync(dir + "package.json"));
                    if (versions[package.name]) {
                        _.merge(versions[package.name], {
                            packagedVersion: package.version,
                            meetsRequirement: semver.satisfies(
                                package.version,
                                versions[package.name].reqVersion)
                        });
                    } else {
                        versions[package.name] = {
                            packagedVersion: package.version,
                            required: false
                        };
                    }
                    callback();
                });

                ex.on("error", function(e) {
                    console.error(e);
                    callback()
                })

                ex.extract({
                    path: dir,
                    filter: function(file) {
                        var package = file &&
                            (file.type === "File" && file.parent === "." &&
                                file.filename === "package.json");
                        return package;
                    }
                });
            }, 10);

            q.drain = function() {
                var table = new Table({
                    head: ["Name", "?", "Required", "Packaged", "Installed"],
                    colWidths: [40, 4, 20, 20, 20]
                });

                // _.pairs(versions).at(1)
                //
                // var list = _.pairs(versions).map(function(v) {
                //     return [v[0]].concat(_.values(_.pick(v[1],
                //       "meetsRequirement", "reqVersion",
                //       "packagedVersion", "installedVersion")));
                // });

                var stringMap = function(s) {
                    if (s === undefined) return "?";
                    return s;
                };

                var list = _.zip(
                    _.keys(versions),
                    _.map(_.pluck(_.values(versions), "meetsRequirement"), function(r) {
                        return r ? "Y" : "N";
                    }),
                    _.map(_.pluck(_.values(versions), "reqVersion"), stringMap),
                    _.map(_.pluck(_.values(versions), "packagedVersion"), stringMap),
                    _.map(_.pluck(_.values(versions), "installedVersion"), stringMap)
                );
                table.push.apply(table, list);

                console.log(table.toString());

                // let's do some checks here
                // packaged but not required
                _.forOwn(versions, function(v, name) {
                    if (!v.required) {
                        cb(new Error("Module file " + name + " is not in package requirements"));
                    }
                });

                // packaged == installed?

                // packaged meets required need?


                cb();
            }

            q.push(_.map(modules, function(m) {
                return {
                    name: m,
                    base: "node_modules"
                }
            }));
        });
    });

    gulp.task("explode-modules", ["check-modules"], function(cb) {
        if (opts && opts.package) {
            explodeModules.push('modules/' + opts.package + '.zip');
        } else {
            _.forOwn(versions, function(v, name) {
                if (v.packagedVersion !== v.installedVersion) {
                    explodeModules.push("modules/" + name + ".zip");
                }
            });
        }

        gutil.log('PACKAGES TO INSTALL', explodeModules);

        glob.glob(explodeModules, function(err, modules) {
            console.log(modules);

            var q = async.queue(function(file, callback) {
                var dir = path.join(file.base, path.basename(file.name, ".zip"));
                var ex = new DecompressZip(file.name);

                gutil.log("Extracting " + file.name + " to " + dir);

                ex.on("extract", function() {

                    glob.glob(dir + "/modules/*.zip", function(err, modules) {
                        if (modules.length > 0) {
                            q.push(_.map(modules, function(m) {
                                return {
                                    name: m,
                                    base: dir + "/node_modules"
                                };
                            }));
                        }

                        callback();
                    });
                });

                ex.on("error", function(e) {
                    console.error(e);
                })

                ex.extract({
                    path: dir
                });
            }, 1);

            q.push(_.map(modules, function(m) {
                return {
                    name: m,
                    base: "node_modules"
                }
            }));

            q.drain = function() {
                cb();
            }
        });
    });

    gulp.task('clean-packaged-modules', function() {
        var packages = opts && opts.package || "*"

        return gulp.src("modules/" + packages + ".zip", {
                cwd: opts.path,
                read: false
            })
            .pipe(clean());
    });

    gulp.task("packdeps-modules", function(cb) {
        exec(__dirname + "/../node_modules/.bin/pac -s npm", {
            maxBuffer: 10000 * 1024
        }, function(err, stdout, stderr) {
            console.log(stdout);
            console.error(stderr);
            exec(__dirname + "/../node_modules/.bin/pac -s bower", {
                maxBuffer: 10000 * 1024
            }, function(err, stdout, stderr) {
                console.log(stdout);
                console.error(stderr);
                cb(err);
            });
        });
    });

    gulp.task('package-modules', ["check-modules"], function(cb) {
        var packages;

        if (opts && opts.package) {
            packages = 'modules/' + opts.package + '.zip';
        } else {
            packages = [];

            _.forOwn(versions, function(v, name) {
                if (v.packagedVersion !== v.installedVersion) {
                    packages.push("node_modules/" + name);
                }
            });
        }

        console.log('Modules to package: ', packages);

        glob.glob(packages, function(err, modules) {
            console.log(modules);

            var streams = modules.map(function(dir) {
                gutil.log("Packaging module... " + dir);

                var modulePath = path.join(cwd, dir);

                var glob = ["**/*", "!modules/**/*"];
                var skip = !fs.statSync(modulePath).isDirectory();

                // first check to see if its got packed components
                if (fs.existsSync(modulePath + "/capitol.json")) {
                    var packageFile = modulePath + "/capitol.json";
                    try {
                        var packageJson = JSON.parse(fs.readFileSync(packageFile));
                        if (packageJson.packagedDependencies) {
                            skip = true;
                        }
                    } catch (e) {
                        gutil.log("Failed to process package file for " + packageFile);
                    }
                }

                if (skip) {
                    return undefined;
                } else {
                    return gulp.src(glob, {
                            cwd: path.join(cwd, dir)
                        })
                        .pipe(zip(path.basename(dir) + ".zip"))
                        .pipe(gulp.dest(path.join(cwd, "/modules")));
                }
            }).filter(function(s) {
                return s !== undefined;
            });

            cb(null, es.merge.apply(es, streams));
        });
    });

    gulp.task("build-modules", ["explode-modules"], function(cb) {
        if (explodeModules.length > 0) {
            exec("npm rebuild", {
                maxBuffer: 10000 * 1024
            }, function(err, stdout, stderr) {
                console.log(stdout);
                console.error(stderr);
                cb(err);
            });
        } else {
            console.log("Skip rebuild. No modules exploded");
            cb();
        }
    });

    gulp.task('bundle-deps', function(cb) {
        require("./bundledDependencies")(process.cwd() + "/package.json", function(err) {
            if (err) {
                cb(err);
                return;
            }
            cb();
        });
    });

    gulp.task('pack-modules', ['bundle-deps'], function(cb) {
        var npm = require("npm")
        npm.load(function(er, npm) {
            if (er) {
                cb(er);
                return;
            }
            npm.commands.pack(cb);
        });
    });

    gulp.task('publish-modules', ['bundle-deps'], function(cb) {
        var npm = require("npm")
        npm.load(function(er, npm) {
            if (er) {
                cb(er);
                return;
            }
            var uri = "http://hwcapdevwb8003.morningstar.com";
            var u = {
                u: opts.user,
                p: opts.password,
                e: opts.email
            };
            var params = {
                auth: {
                    username: u.u,
                    password: u.p,
                    email: u.e
                }
            };
            npm.registry.adduser(uri, params, function(er, doc) {
                if (er) return cb(er);

                // don't want this polluting the configuration
                npm.config.del("_token", "user")

                if (doc && doc.token) {
                    npm.config.setCredentialsByURI(uri, {
                        token: doc.token
                    }, "user");
                } else {
                    npm.config.setCredentialsByURI(uri, {
                        username: u.u,
                        password: u.p,
                        email: u.e,
                        alwaysAuth: npm.config.get("always-auth")
                    }, "user");
                }

                //npm.config.save("user", function(err) {
                    npm.config.set("registry", uri);
                    npm.commands.publish([], cb);
                //});
            });
        });
    });

    if (cb) {
        cb(undefined, cmd + "-modules");
    }
}