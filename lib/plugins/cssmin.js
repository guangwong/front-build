var compressor = require('../cssmin').compressor;
var fs = require('fs');
var path = require('path');
var fu = require('../fileutil');
var async = require('async');


module.exports = function(){
    var cssReg = /\.css$/i;
    var cssMinReg = /-min\.js$/i;
    return function (page, next) {
        console.log('plugin: cssmin')
        var build_core = path.resolve(page.destDir, 'core');
        fu.findInDir(build_core, cssReg, function (err, files){
            if (err) {
                return next(err);
            }
            async.forEach(
                files,
                function (file, callback) {
                    if (cssMinReg.test(file)) {
                        return callback(null);
                    }
                    var src = path.resolve(build_core, file);
                    var dest = path.resolve(build_core, file.replace(cssReg, '-min.css'));

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
                },
                next);
        });
    }
};