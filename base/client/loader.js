"use strict";
/* jshint ignore:start */
(function() {

var Ap = Array.prototype;
var slice = Ap.slice;
var Fp = Function.prototype;

if (!Fp.bind) {
  // PhantomJS doesn't support Function.prototype.bind natively, so
  // polyfill it whenever this module is required.
  Fp.bind = function(context) {
    var func = this;
    var args = slice.call(arguments, 1);

    function bound() {
      var invokedAsConstructor = func.prototype && (this instanceof func);
      return func.apply(
        // Ignore the context parameter when invoking the bound function
        // as a constructor. Note that this includes not only constructor
        // invocations using the new keyword but also calls to base class
        // constructors such as BaseClass.call(this, ...) or super(...).
        !invokedAsConstructor && context || this,
        args.concat(slice.call(arguments))
      );
    }

    // The bound function must share the .prototype of the unbound
    // function so that any object created by one constructor will count
    // as an instance of both constructors.
    bound.prototype = func.prototype;

    return bound;
  };
}

})();
/* jshint ignore:end */
/* jshint browser: true */
var loader = require("capitol-dome/loader");
var min = (loader.getMeta("min") === "true");
var initialApp = (loader.getMeta("initialApp") || "application");

if (document.addEventListener) {
	loader("/js/libs" + (min ? ".min" : "") + ".js", "lib");
} else {
	loader("/js/libs_legacy" + (min ? ".min" : "") + ".js", "lib");
}
loader.ready("lib", function() {
	loader("/js/" + initialApp + (min ? ".min" : "") + ".js");
});