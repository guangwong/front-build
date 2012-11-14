var async = require('async');
var fu = require('../fileutil');
var _ = require('underscore');
var path = require('path');
var fs = require('fs');

/***
 * Plugin to Write the generated template module back to sorce directory
 * @param config
 * @return {Function}
 */
module.exports = function (config) {
    config = _.extend({
        //css 正则
        fileReg: /-x?tpl\.html$/i,
        base: 'page'
    }, config);

    return function (page, next) {

        var srcBase = path.join(page.srcDir, config.base);
        var srcUtils = path.join(page.srcDir, 'utils');
        var versionBase = path.join(page.versionDir, config.base);
        var utilsDir = page.utilsDir;
        var appCharset = page.appCharset;

        async.series(
            [
                function(callback){
                    fu.iconv({
                        from: {
                            path: srcBase,
                            charset: 'utf8',
                            test: /-x?tpl\.js$/i
                        },

                        to: {
                            path: versionBase,
                            charset: config.inputCharset
                        }

                    }, callback);
                },

                function (callback) {

                    if (!utilsDir) {
                        return callback(null);
                    }


                    fs.exists(utilsDir, function (exist) {
                        if (!exist) {
                            return callback();
                        }
                        fu.iconv({
                            from: {
                                path: srcUtils,
                                charset: 'utf8',
                                test: /-x?tpl\.js$/i
                            },

                            to: {
                                path: utilsDir,
                                charset: appCharset
                            }

                        }, callback);
                    });

                }
            ],
            function(err) {
                if (err) {
                    return next(err);
                }
                next(null);
            }
        );
    }
};