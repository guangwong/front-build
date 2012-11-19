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
                            path: page.sourceBase,
                            charset: page.inputCharset
                        }

                    }, callback);
                },

                function (callback) {

                    if (!page.utilsDir) {
                        return callback(null);
                    }
                    var srcUtils = path.join(page.srcDir, 'utils');
                    var appCharset = page.appCharset;
                    var utilsDir = page.utilsDir;


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
                                path: page.utilsDir,
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