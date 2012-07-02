var CssCombo = require('css-combo');
var fu = require('../fileutil');
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('underscore')
/**
 * plugin css-combo for FrontBuild
 * will mixin the imported css
 */
module.exports = function (config){
    config = _.extend({
        //css 正则
        cssReg: /.*\.css$/i, 

        // 子目录
        base: '.' 
    }, config);

    return function (page, next) {
        console.log('plugin: css-combo')
        var srcBase = path.resolve(page.srcDir, config.base);
        var buildBase = path.resolve(page.destDir, config.base);

        path.exists(srcBase, function (exist) {

            if (!exist) {
                return next();
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
                                return callback(err);
                            }
                            callback(stat.isFile() && /\.css$/i.test(file));
                        });
                    },

                    function (files) {
                        console.log(files);

                        if (files.length === 0) {
                            return next(null);
                        }

                        async.forEach(files, function (file, callback) {
                            var src = path.resolve(srcBase, file);

                            CssCombo.build({
                                target: path.resolve(srcBase, file),
                                inputEncoding: page.charset,
                                outputEncoding: page.charseet,
                                debug: page.debug,
                                output: buildBase
                            }, callback);
                            
                        }, next);
                });

            });
            
        });
    }
};