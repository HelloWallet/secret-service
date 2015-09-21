var _ = require("lodash"),
    async = require("async"),
    request = require("request"),
    gulp = require("./gulp"),
    debug = require("debug")("deploy");

module.exports = function(opts, cb) {

    var application = opts.application,
        deployProcess = opts.process || "Deploy Everything by Server Group",
        environment = opts.environment || "DEV",
        components = opts.components.split(","),
        versions = opts.versions.split(","),
        user = opts.username,
        password = opts.password
        requestId = null;

    gulp.ssMessage("UDeploy mission starting...");

    gulp.task("return-status", ["check-status"], function(cb) {
        //notify success
        gulp.util.log(gulp.colors.red("The eagle is airborne."));
        cb();
    });

    gulp.task("check-status", ["get-process-id"], function(cb) {
        // check status response
        var respObj,
            getStatus = function (cb, results) {
                gulp.util.log(gulp.colors.yellow("Checking uDeploy status..."));
                return request({
                    method: "GET",
                    url: "https://udeploy.morningstar.com/cli/applicationProcessRequest/requestStatus",
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
                    if (bodyObj.status === "CLOSED") {
                        cb(undefined, bodyObj);
                    } else {
                        cb(bodyObj.status, bodyObj);
                    }
                });
            }

        // poll for response up to 50 times every 10 secs
        async.retry({times: 50, interval: 10000}, getStatus, function(err, result) {
            if (!err) {
                cb();
            } else {
                 if (err === "EXECUTING") {
                    cb(new Error("uDeploy not executing in time."));
                } else {
                    cb(new Error(err));
                }
            }
        });
    });

    gulp.task("get-process-id", function (cb) {

        // build json with correct params
        var deployReq = {
            application: application,
            applicationProcess: deployProcess,
            environment: environment,
            onlyChanged: false,
            versions: _.map(components, function (item, index) {
                return {
                    component: item.trim(),
                    version: versions[index] ? versions[index].trim() : "latest"
                }
            })
        };

        //post json to udeploy api
        request({
            method: "PUT",
            url: "https://udeploy.morningstar.com/cli/applicationProcessRequest/request",
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
            if (!err) {
                cb();
            } else {
                cb(new Error(error));
            }
        });
    })

    cb(undefined, "return-status");
}
