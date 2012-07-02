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
var _ = require('underscore');

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

    var config = _.extend({
        base: ''
    }, config);

    return function (page, next) {
        var base_src = path.resolve(page.srcDir, config.base);
        var base_build = path.resolve(page.destDir, config.base);
        fs.readdir(base_src, function(err, files) {

            if (err) {
                return next(err);
            }
            
            async.filter(
                files, 
                function(file, callback) {
                    fs.stat(path.resolve(base_src, file), function(err, stat){
                        if(err) {
                            return callback(err);
                        }
                        return stat.isFile() && /\.less$/i.test(file);
                    });
                }, 
                function (files) {

                    if (files.length === 0) {
                        return callback(null);
                    }

                    async.forEach(files, function (file, callback){
                        var src = path.resolve(base_src, file);

                        var dest = path.resolve(base_build, file.replace(/\.less$/i, '.css'));

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

        });
    }
}