
var path = require('path');
var fu = require('../fileutil');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var CSSLint = require('../3rd/csslint/csslint-node').CSSLint;

var printResult = function(message){
    console.log(message);
}
    
var build_dir = function (dir, callback) {
    var cssReg = /\.css$/i;
    var cssMinReg = /-min\.js$/i;
    var formatId = 'text';
    fu.findInDir(dir, cssReg, function (err, files) {
        if (err) {
            return callback(err);
        }
        files = files.filter(function (file) {
            return !cssMinReg.test(file);
        });
        var formatter = CSSLint.getFormatter(formatId);
        var output = formatter.startFormat();
        if (output){
            printResult(output);
        }
        async.forEach(
            files,
            function (file, callback) {
                var src = path.resolve(dir, file);
                var options = {};

                fs.readFile(src, 'utf8', function(err, cssContent) {
                    // console.log('csslint: ', cssContent)
                    if (err) {
                        return callback(err);
                    }
                    var result = CSSLint.verify(cssContent);
                    if (!cssContent) {
                        if (formatter.readError) {
                            printResult(formatter.readError(relativeFilePath, "Could not read file data. Is the file empty?"));
                        } else {
                            printResult("csslint: Could not read file data in " + relativeFilePath + ". Is the file empty?");
                        }
                    }
                    
                    options.fullpath = src;
                    var output = formatter.formatResults(result, file, options);
                    printResult(output);

                    callback(null);
                });
                return;
            }, function (err) {
                if (err) {
                    callback(err);
                }
                output = formatter.endFormat();
                if (output){
                    printResult(output);
                }
                console.log('');
                callback(null);
            });
    });
};

module.exports = function(config) {

    _.extend(config);

    return function (page, next) {
        console.log('plugin: csslint');
        
        var srcDir = path.resolve(page.srcDir);
        fs.exists(srcDir, function (exist) {
            if (!exist) {
                return next();
            }
            build_dir(srcDir, next);
        });
        
    }
};