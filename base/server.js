require("capitol-core").init({
    Types: require("capitol-types")
});

var capitol = require("capitol-core"),
    logger = capitol.logger.getLogger(__filename),
    express = capitol.express,
    config = capitol.config,
    sessionStore = require("./server/util/session").getSessionStore();

var app = capitol.Locomotive.createServer({
});

module.exports = app;