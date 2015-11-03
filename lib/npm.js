"use strict";

var npm = require("npm");
var debug = require("debug")("npm");
var fs = require("fs");
var _ = require("lodash");

function createNpmDependenciesArray(projPackageJSON) {
    if (!projPackageJSON.dependencies) {
        return [];
    }
    return projPackageJSON.privateDeps.map(function (mod) {
        if (projPackageJSON.dependencies[mod]) {
            return mod + "@" + projPackageJSON.dependencies[mod];
        } else {
            return mod + "@" + projPackageJSON.devDependencies[mod];
        }
    });
}

function createPublicNpmDependenciesArray(projPackageJSON, deps) {
    if (!projPackageJSON.dependencies) {
        return [];
    }
    return _.chain(deps)
        .omit(projPackageJSON.privateDeps)
        .pairs().map(function (mod) {
            return mod[0] + "@" + mod[1];
        }).value();
}


npm.load(function (err) {
    function cb(err) {
        if (err) {
            console.error(err);
            return process.exit(1);
        }
        return process.exit(0);
    }

    if (err) {
        return cb(new Error("npm load error: " + err));
    }


    var data = JSON.parse(process.argv[2]);

    var cmd = data.cmd;
    var opts = data.opts;
    var cwd = data.cwd;
    var projPackageJSON = JSON.parse(fs.readFileSync(cwd + "/package.json"));
    var deps;

    debug("NPM fork command: " + cmd);

    if (cmd === "rebuild") {
        npm.commands.rebuild(function (err) {
            if (err) {
                return cb(new Error("npm rebuild error: " + err));
            }
            cb();
        });
    } else if (cmd === "pack") {
        npm.commands.pack([], cb);

    } else if (cmd === "install-private") {
        var uri = opts.uri;

        deps = [].concat(projPackageJSON.privateDeps || []);


        if (deps.length > 0) {
            debug("Found " + deps.length + " private dependencies to install");

            if (uri === undefined) {
                uri = projPackageJSON.privateRepository;
            }

            var installDeps = createNpmDependenciesArray(projPackageJSON);

            debug("Installing private dependencies (from " + uri + "):" + installDeps);

            npm.config.set("registry", uri);
            npm.commands.install(installDeps, function (err) {
                if (err) {
                    return cb(new Error("npm install error: " + err));
                }
                npm.commands.rebuild(function (err) {
                    if (err) {
                        return cb(new Error("npm rebuild error: " + err));
                    }
                    cb();
                });
            });
        } else {
            cb();
        }
    } else if (cmd == "install-public") {
        deps = _.merge({},
                projPackageJSON.dependencies || {},
                projPackageJSON.devDependencies || {});

        var publicInstallDeps = createPublicNpmDependenciesArray(projPackageJSON, deps);

        debug("Installing public dependencies: " + publicInstallDeps);

        npm.load(function (err) {
            if (err) {
                return cb(new Error("npm load error: " + err));
            }
            npm.commands.install(publicInstallDeps, function (err) {
                if (err) {
                    return cb(new Error("npm install error: " + err));
                }
                cb();
            });
        });
    } else if (cmd === "publish") {
        if (opts.package) {
            process.chdir("./node_modules/" + opts.package);
        }
        npm.load(function (er, npm) {
            if (er) {
                cb(er);
                return;
            }
            var uri = opts.uri;
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
            npm.registry.adduser(uri, params, function (er, doc) {
                if (er) {
                    return cb(er);
                }

                // don't want this polluting the configuration
                npm.config.del("_token", "user");

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

                npm.config.set("registry", uri);
                npm.commands.publish([], cb);
            });
        });
    } else {
        cb(new Error("Command not supported " + cmd));
    }

});
