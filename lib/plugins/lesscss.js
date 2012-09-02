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
    var parser = new(less.Parser)({
        paths: options.paths,
        optimization: options.optimization,
        filename: options.filename,
        strictImports: options.strictImports
    });

    parser.parse(target.data, function (err, tree) {
        if (err) {
            less.writeError(err, options);
            callback(err);
            return;
        }

        try {
            var css = tree.toCSS({
                compress: options.compress,
                yuicompress: options.yuicompress
            });
            fu.mkdirp(path.dirname(target.dest), function(err){
                if(err) {
                    return callback(err);
                }
                fs.writeFile(target.dest, css, 'utf8', callback);
            });


        } catch (e) {
            less.writeError(e, options);
            return callback(e);
        }
    });
};

module.exports = function(config) {
    var config = config || {};
    var config = _.defaults(config, {
        base: '',
        compress: false,
        yuicompress: false,
        optimization: 1,
        silent: false,
        color: true,
        strictImports: false
    });

    return function (page, next) {
        var report = {
            name: 'lesscss',
            files: []
        };

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
                        callback(stat.isFile() && /\.less$/i.test(file));
                    });
                }, 
                function (files) {


                    if (files.length === 0) {
                        return next(null, report);
                    }

                    async.forEach(files, function (file, callback){
                        var src = path.resolve(base_src, file);

                        var dest = path.resolve(base_build, file.replace(/\.less$/i, '.css'));


                        fs.readFile(src, 'utf8', function(err, data) {

                            if (err) {
                                return callback(err);
                            }

                            report.files.push(file);

                            parseLessFile({
                                data: data,
                                dest: dest
                            }, {
                                paths: [ path.dirname(src) ],
                                compress: config.compress,
                                yuicompress: config.yuicompress,
                                optimization: config.optimization,
                                silent: config.silent,
                                color: config.color,
                                filename: file,
                                strictImports: config.strictImports
                            }, callback);
                        });

                    }, function (err) {

                        if (err) {
                            return next(err);
                        }
                        
                        next(null, report);

                    });
            });

        });
    }
}