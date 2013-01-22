var Utils = {};

var exec = require('child_process').exec;
var os = require('os');

Utils.detectCommand = function(cmd, callback) {
    //for now, not support for win
    if (os.platform().match(/^win/)) {
        callback(false);
        return;
    }


    exec("hash " + cmd + " 2>/dev/null || { exit 1; }", function (err) {
        callback(null === err);
    });
};

module.exports = Utils;