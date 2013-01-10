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


module.exports = function(config) {
    config = config || {};
    config = _.defaults(config, {
        base: '',
        compress: false,
        yuicompress: false,
        optimization: 1,
        silent: true,
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
                next(err);
                return;
            }

            async.filter(
                files,

                function(file, callback) {

                    // filter less files
                    fs.stat(path.resolve(base_src, file), function(err, stat){
                        if(err) {
                            callback(err);
                            return;
                        }
                        callback(stat.isFile() && /\.less$/i.test(file));
                    });
                },

                function (files) {

                    if (files.length === 0) {
                        next(null, report);
                        return;
                    }



                    async.forEach(files, function (file, callback) {
                        var src = path.resolve(base_src, file);

                        var dest = path.resolve(base_build, file.replace(/\.less$/i, '.css'));


                        fs.readFile(src, 'utf8', function(err, data) {

                            if (err) {
                                callback(err);
                                return;
                            }

                            report.files.push(file);

                            try {

                                var parser = new(less.Parser)({
                                    rootpath: path.dirname(src),
                                    paths: [path.dirname(src), path.join(page.srcDir) ],
                                    optimization: config.optimization,
                                    filename: file,
                                    strictImports: config.strictImports
                                });

                                parser.parse(data, function (err, tree) {
                                    if (err) {

                                        // keep the color
                                        less.writeError(err, {
                                            color: config.color
                                        });

                                        callback(err);

                                        return;
                                    }

                                    try {

                                        var css = tree.toCSS({
                                            compress: config.compress,
                                            yuicompress: config.yuicompress
                                        });

                                    } catch (e) {

                                        less.writeError(e, {
                                            color: config.color
                                        });

                                        callback(e);
                                        return;
                                    }

                                    fu.mkdirp(path.dirname(dest), function(err) {
                                        if(err) {
                                            callback(err);
                                            return;
                                        }
                                        fs.writeFile(dest, css, 'utf8', callback);
                                    });
                                });

                            } catch(e) {
                                callback(e);
                            }

                        });

                    }, function (err) {

                        if (err) {
                            next(err);
                            return;
                        }

                        next(null, report);

                    });
                });

        });
    }
};