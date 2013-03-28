var Utils = {};

var exec = require('child_process').exec;
var os = require('os');

Utils.detectCommand = function(cmd, callback) {
    //not detect windows
    if (os.platform().match(/^win/)) {
        callback(true);
        return;
    }


    exec("hash " + cmd + " 2>/dev/null || { exit 1; }", function (err) {
        callback(null === err);
    });
};

module.exports = Utils;