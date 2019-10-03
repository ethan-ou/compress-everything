// Enables ES6+ imports in Node
require = require("esm")(module/*, options*/)
require('v8-compile-cache');
module.exports = require("./main.js")