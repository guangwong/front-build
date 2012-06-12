/**
 * Less plugin for FrontBuild
 * build less from src/core to build/core
 * @author <maxbbn qipbbn@gmail.com>
 */

var path = require('path');
var fs = require('fs');
var sys = require('util');
var less = require('less');
var os = require('os');
var fu = require('../fileutil');
var async = require('async');

var parseLessFile = function (target, options, callback) {
    var parser = new(less.Parser)(options);

    parser.parse(target.data, function (err, tree) {
        if (err) {
            less.writeError(err, options);
            callback(err);
            return;
        }

        try {
            var css = tree.toCSS({
                compress: false
            });
            fs.writeFile(target.dest, css, 'utf8', callback);

        } catch (e) {
            less.writeError(e, options);
            return callback(e);
        }
    });
};

module.exports = function(config) {

    return function (page, next) {
        console.log('plugin: less');
        var core_src = path.resolve(page.srcDir, 'core');
        var core_build = path.resolve(page.destDir, 'core');
        fu.findInDir(core_src, /.*\.less$/, function(err, files) {
            if (err) {
                return next(err);
            }

            if (!files || files.length === 0) {
                return next();
            }

            async.forEach(files, function (file, callback){
                var src = path.resolve(core_src, file);
                var dest = path.resolve(core_build, file + '.css');
                fs.readFile(src, 'utf8', function(err, data) {

                    if (err) {
                        return callback(err);
                    }

                    parseLessFile({
                        data: data,
                        dest: dest
                    }, {
                        yuicompress: false,
                        optimization: 1,
                        silent: false,
                        paths: [ path.dirname(src) ],
                        color: true,
                        filename: file,
                        strictImports: false
                    }, callback);
                });
            }, next);
        });
    }
}