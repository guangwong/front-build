var util = require('util');
require('colors');

exports.printError = function (err) {

    var stack;

    if (!err) {
        util.debug('Unknown Error!')
        return;
    }

    if (err.stack) {
        stack = err.stack;
        delete err.stack;
    }

    util.debug(JSON.stringify(err, null, 2).red);

    if (stack) {
        util.debug(stack.red);
    }
};