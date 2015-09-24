var _ = require("lodash"),
    async = require("async"),
    request = require("request"),
    gulp = require("./gulp"),
    debug = require("debug")("deploy");

module.exports = function(opts, cb) {

    var server = opts.server,
        application = opts.application,
        deployProcess = opts.process || "Deploy Everything by Server Group",
        environment = opts.environment || "DEV",
        components = opts.components,
        versions = opts.versions,
        user = opts.username,
        password = opts.password
        requestId = null;

    gulp.ssMessage("UDeploy mission starting...");

    gulp.task("return-status", ["check-status"], function(cb) {
        //notify success
        gulp.util.log(gulp.colors.red("The eagle is airborne."));
        cb();
    });

    gulp.task("check-status", ["send-process-request"], function(cb) {

        // check status response
        var respObj,
            getStatus = function (cb, results) {
                gulp.util.log(gulp.colors.yellow("Checking uDeploy status for request: " + requestId + "..."));
                return request({
                    method: "GET",
                    url: server + "/cli/applicationProcessRequest/requestStatus",
                    auth: {
                        user: user,
                        pass: password
                    },
                    rejectUnauthorized: false,
                    requestCert: true,
                    agent: false,
                    qs: {
                        request: requestId
                    }
                }, function(err, resp, body) {
                    var bodyObj = JSON.parse(body);
                    if (bodyObj.status === "CLOSED" || bodyObj.status === "FAULTED") {
                        cb(undefined, bodyObj);
                    } else {
                        cb(new Error(bodyObj.status), bodyObj);
                    }
                });
            }

        // poll for response up to 50 times every 10 secs
        async.retry({times: 50, interval: 10000}, getStatus, function(err, result) {
            if (!err) {
                //have to pass no error to end retry
                if (result.status === "FAULTED" || result.result === "FAULTED") {
                    cb(new Error("uDeploy fault: " + result.result));
                } else {
                    cb();
                }
            } else {
                 if (err === "EXECUTING") {
                    cb(new Error("uDeploy not executing in time."));
                } else {
                    cb(new Error(err));
                }
            }
        });
    });

    gulp.task("send-process-request", function (cb) {

        if (!server) {
            cb(new Error("No server specified."));
        }

        if (!application) {
            cb(new Error("No application specified."));
        }

        if (!components) {
            cb(new Error("No components specified."));
        } else {
            components = components.split(",");
        }

        if (!versions) {
            gulp.util.log("No versions specified. Using `latest`");
        } else {
            versions = versions.split(",");
        }

        // build json with correct params
        var deployReq = {
            application: application,
            applicationProcess: deployProcess,
            environment: environment,
            onlyChanged: false,
            versions: _.map(components, function (item, index) {
                return {
                    component: item.trim(),
                    version: versions ? versions[index].trim() : "latest"
                }
            })
        };

        //post json to udeploy api
        request({
            method: "PUT",
            url: server + "/cli/applicationProcessRequest/request",
            auth: {
                user: user,
                pass: password
            },
            rejectUnauthorized: false,
            requestCert: true,
            json: true,
            agent: false,
            body: deployReq
        }, function(err, resp, body) {
            requestId = body.requestId;
            if (requestId) {
                cb();
            } else {
                cb(new Error(body));
            }
        });
    })

    cb(undefined, "return-status");
}
