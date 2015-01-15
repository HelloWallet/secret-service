var capitol = require("capitol"),
    express = capitol.express,
    config = capitol.config;

capitol.config.load("./capitol.json");

capitol.Locomotive.createServer({});
