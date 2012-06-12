var CssCombo = require('css-combo');
var fu = require('../fileutil');
var path = require('path');
var async = require('async');
/**
 * plugin css-combo for FrontBuild
 * will mixin the imported css
 */
module.exports = function (){
    var cssReg = /.*\.css$/i;

    return function (page, next) {
        console.log('plugin: css-combo')
        var srcCore = path.resolve(page.srcDir, 'core');
        var buildCore = path.resolve(page.destDir, 'core');
        path.exists(srcCore, function (exist) {
            if (!exist) {
                return next();
            }
            fu.findInDir(srcCore, cssReg, function(err, files){
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