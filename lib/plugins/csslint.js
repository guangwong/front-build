
var path = require('path');
var fu = require('../fileutil');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var CSSLint = require('../3rd/csslint/csslint-node').CSSLint;

var printResult = function(message){
    console.log(message);
}

var rules = {
    "important": 1,
    "adjoining-classes": 1,
    "known-properties": 1,
    "box-sizing": 1,
    "box-model": 1,
    "outline-none": 1,
    "duplicate-background-images": 1,
    "compatible-vendor-prefixes": 1,
    "display-property-grouping": 1,
    "qualified-headings": 1,
    "fallback-colors": 1,
    "duplicate-properties": 1,
    "empty-rules": 1,
    "errors": 1,
    "shorthand": 1,
    "ids": 1,
    "gradients": 1,
    "font-sizes": 1,
    "font-faces": 1,
    "floats": 1,
    "underscore-property-hack": 1,
    "overqualified-elements": 1,
    // "import": 1,
    "regex-selectors": 1,
    "rules-count": 1,
    "star-property-hack": 1,
    "text-indent": 1,
    "unique-headings": 1,
    "universal-selector": 1,
    "unqualified-attributes": 1,
    "vendor-prefix": 1,
    "zero-units": 1
};
    
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
        var startOutput = formatter.startFormat();

        // if (output){
            // printResult(output);
        // }

        async.map(
            files,
            function (file, callback) {
                var src = path.resolve(dir, file);
                var options = {};

                fs.readFile(src, 'utf8', function(err, cssContent) {
                    // console.log('csslint: ', cssContent)
                    if (err) {
                        return callback(err);
                    }
                    var result = CSSLint.verify(cssContent, rules);

                    if (!cssContent) {
                        // if (formatter.readError) {
                        //     printResult(formatter.readError(src, "Could not read file data. Is the file empty?"));
                        // } else {
                        //     printResult("csslint: Could not read file data in " + src + ". Is the file empty?");
                        // }
                        callback(null, {
                            file: file,
                            fullpath: src,
                            output: 'file is empty'
                        });
                    }
                    
                    options.fullpath = src;
                    var output = formatter.formatResults(result, file, options);
                    // printResult(output);
                    

                    callback(null, {
                        file: file,
                        fullpath: src,
                        errorCount: _.filter(result.messages, function(msg){ return msg.type === 'error'; }).length,
                        warningCount: _.filter(result.messages, function(msg){ return msg.type === 'warning'; }).length,
                        output: output
                    });
                });
                return;
            }, function (err, cssReports) {

                if (err) {
                    return callback(err);
                }

                cssReports.endOutput = formatter.endFormat();
                callback(null, cssReports);
            });
    });
};

module.exports = function(config) {

    _.extend(config);

    return function (page, next) {
        var startTime = new Date();

        var reports = {
            name: 'csslint',
            lintReport : [],
            errorCount: 0,
            warningCount: 0
        };
        
        var srcDir = path.resolve(page.srcDir);
        fs.exists(srcDir, function (exist) {
            if (!exist) {
                return next(null, reports);
            }
            build_dir(srcDir, function (err, cssReports) {
                if (err) {
                    return next(err);
                }

                reports.used_time = new Date() - startTime;
                reports.lintReport = cssReports;

                cssReports.forEach(function (rep) {
                    reports.errorCount += rep.errorCount;
                    reports.warningCount += rep.warningCount;
                });
                
                next(null, reports);
            });
        });
        
    }
};