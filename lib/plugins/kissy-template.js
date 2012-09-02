var CssCombo = require('css-combo');
var fu = require('../fileutil');
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('underscore')


function buildTemplate (job, callback) {
    fs.readFile(job.src, 'utf-8', function (err, cnt) {
        if (err) {
            return callback(err);
        }
        var obj = JSON.stringify({html: cnt});
        var wrap = 'KISSY.add(function(){\n    return ' + obj + ';\n});';

        fs.writeFile(job.target, wrap, callback);
    });
}
/**
 * plugin css-combo for FrontBuild
 * will mixin the imported css
 */
module.exports = function (config) {
    config = _.extend({
        //css 正则
        fileReg: /-tpl\.html$/i, 

        // 子目录
        base: '.'
    }, config);

    return function (page, next) {
        var start_time = new Date();

        var reports = {
            name: 'kissy-template',
            files: []
        };
        var srcBase = path.resolve(page.srcDir, config.base);
        var buildBase = path.resolve(page.destDir, config.base);
        var versionBase = path.resolve(page.versionDir, config.base);

        fu.findInDir(srcBase, config.fileReg, function (err, files) {
            if (err) {
                return next(err);
            }
            if (!files.length) {
                reports.used_time = new Date() - start_time;
                return next(null, reports);
            }
            async.forEach(files, function (file, callback) {
                var job = {
                    src: path.resolve(srcBase, file),
                    target: path.resolve(srcBase, file.replace(/\.html$/i, '.js')),
                    file: file
                };
                reports.files.push(file);
                buildTemplate(job, callback);

            }, function (err) {
                if (err) {
                    return next(err);
                }
                fu.iconv({
                    from: {
                        path: srcBase,
                        charset: 'utf-8',
                        test: /-tpl\.js$/i
                    },
                    
                    to: {
                        path: versionBase,
                        charset: page.config.inputCharset
                    }

                });
                reports.used_time = new Date() - start_time;
                next(null, reports);
            });
        });

    }
};