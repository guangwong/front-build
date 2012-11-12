var async = require('async');
var fu = require('../fileutil');
var _ = require('underscore');
var path = require('path');


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

//        console.log(appCharset);
//        console.log(utilsDir);
//        console.log(srcUtils);


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
                    if (utilsDir) {
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
                    }
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