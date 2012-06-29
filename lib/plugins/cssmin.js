var compressor = require('../cssmin').compressor;
var fs = require('fs');
var path = require('path');
var fu = require('../fileutil');
var async = require('async');
var _ = require('underscore');


    
var build_dir = function (dir, callback) {
    var cssReg = /\.css$/i;
    var cssMinReg = /-min\.js$/i;
    fu.findInDir(dir, cssReg, function (err, files) {
        if (err) {
            return callback(err);
        }
        async.forEach(
            files,
            function (file, callback) {
                if (cssMinReg.test(file)) {
                    return callback(null);
                }
                var src = path.resolve(dir, file);
                var dest = path.resolve(dir, file.replace(cssReg, '-min.css'));

                fs.stat(dest, function(err, stat) {
                    if (err) {
                        fs.readFile(src, 'utf8', function(err, cssContent) {
                            if (err) {
                                return callback(err);
                            }
                            var min_css = compressor.cssmin(cssContent);
                            fs.writeFile(dest, min_css, 'utf8', callback);
                        });
                        return;
                    }
                    callback(null);
                });
            }, callback);
    });
};

module.exports = function(config) {

    _.extend(config);

    return function (page, next) {
        console.log('plugin: cssmin');
        
        var destDir = path.resolve(page.destDir);
        path.exists(destDir, function (exist) {
            if (!exist) {
                return next();
            }
            build_dir(destDir, next);
        });
        
    }
};