var util = require('util');
var colors = require('colors');

exports.printError = function (err) {
    util.debug(err.stack.red);
    delete err.stack;
    util.debug(JSON.stringify(err, null, 2).red);
};