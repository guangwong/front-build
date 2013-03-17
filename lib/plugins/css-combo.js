var CssCombo = require('css-combo');
var fu = require('../fileutil');
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('underscore');
/**
 * plugin css-combo for FrontBuild
 * will mixin the imported css
 */
module.exports = function (config){
    config = _.extend({
        //css 正则
        cssReg: /.*\.css$/i, 

        // 子目录
        base: '.',
        compress: false,
        debug: false,
        silent: true
    }, config);

    return function (page, next) {
        var report = { 
            name: 'css-combo',
            jobs: []
        };
        var srcBase = path.resolve(page.srcDir, config.base);
        var buildBase = path.resolve(page.destDir, config.base);

        fs.exists(srcBase, function (exist) {

            if (!exist) {
                return next(null, report);
            }

            fs.readdir(srcBase, function(err, files) {

                if (err) {
                    return next(err);
                }
                
                async.filter(
                    files, 
                    function(file, callback) {

                        fs.stat(path.resolve(srcBase, file), function(err, stat){

                            if(err) {
                                return callback(false);
                            }
                            if (!stat.isFile()) {
                                return callback(false);
                            }
                            if (!/\.css$/i.test(file)) {
                                return callback(false);
                            }
                            if (/-min\.css$/i.test(file)) {
                                return callback(false);
                            }

                            return callback(true);
                        });
                    },

                    function (files) {

                        if (files.length === 0) {
                            return next(null, report);
                        }

                        async.forEach(files, function (file, callback) {

                            CssCombo.build({
                                target: path.resolve(srcBase, file),
                                inputEncoding: page.charset,
                                outputEncoding: page.charset,
                                debug: config.debug,
                                silent: true,
                                output: path.resolve(buildBase, file),
                                compress: config.compress
                            }, function (err, job) {
                                if (err) {
                                    return callback(err);
                                }
                                job.filename = file;
                                report.jobs.push(job);
                                return callback(null);
                            });
                            
                        }, function (err) {
                            if (err) {
                                return next(err, report);
                            }
                            next(null, report);
                        });
                });

            });
            
        });
    }
};