"use strict";

var capitol = require("capitol-core");
var expressSession = capitol.expressSession;

module.exports = {
	getSessionStore: function() {
		return expressSession.MemoryStore;
	}
};