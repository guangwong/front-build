var CssCombo = require('css-combo');
var fu = require('../fileutil');
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
        var srcCore = path.resolve(page.srcDir, config.base);
        var buildCore = path.resolve(page.destDir, config.base);
        path.exists(srcCore, function (exist) {
            if (!exist) {
                return next();
            }
            fu.findInDir(srcCore, config.cssReg, function(err, files){
                if (err) {
                    return next(err);
                }
                if (!files.length) {
                    return next();
                }
                async.forEach(files, function (cssfile, callback) {

                    CssCombo.build({
                        target: path.resolve(srcCore, cssfile),
                        inputEncoding: page.charset,
                        outputEncoding: page.charseet,
                        debug: page.debug,
                        output: path.resolve(buildCore)
                    }, callback);

                }, next);
            });
        });
    }
};