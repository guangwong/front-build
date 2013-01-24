/**
 * Compass plugin for FrontBuild
 * @author <neekey ni184775761@gmail.com>
 */

var path = require('path');
var _ = require('underscore');
var Exec = require('child_process').exec;
var Utils = require('../utils');

module.exports = function(config) {
    var defaultConfig = {

        /**
         * @type {String} CSS输出类型: nested, expanded, compact, compressed
         */

        outputStyle: 'nested',

        /**
         * @type {String|String[]} 添加用于@import查找模块路径
         */

        importPath: [ './' ],

        /**
         * @type {Boolean} 是否输出对应的SASS/SCSS源文件行数
         */

        lineComments: true,

        /**
         * @type {String} Sprite 图片功能查找目录
         * todo 暂时sprite这块合并后的sprite图片的路径有点问题，之后看看有没有好的方法解决
         *      另外，如果合并后的图片是生成到sprite制定的目录下，由于现在的temp目录机制，图片可能会直接被删掉...这是个问题
         */

        images: './images',

        /**
         * @type {Boolean=false} 是否强制编译，即使文件没有变化
         */

        force: false
    };

    return function (page, next) {

        // Compass配置
        var compassConfig = _.defaults(
            ( page.config && page.config.plugins && page.config.plugins.compass ) || {},
            defaultConfig
        );

        if (!compassConfig.enable) {
            next(null);
            return;
        }

        // 检查是否已经安装过compass
        Utils.detectCommand('compass', function(exists){
            if (!exists) {
                console.log('Compass not detected on you System! Please install it first: [ http://compass-style.org ]' );
                next(null);
                return;
            }
            // 输入与输出目录
            var base_src = path.resolve(page.srcDir, config.base);
            var base_build = path.resolve(page.destDir, config.base);

            compassConfig.sassDir = base_src;
            compassConfig.cssDir = base_build;

            // 构造命令
            var command = "compass compile";
            command += ' --sass-dir="' + compassConfig.sassDir + '" --css-dir="' + compassConfig.cssDir + '"';

            if ( compassConfig.images !== undefined ) {
                command += ' --images-dir="' + path.resolve( base_src, compassConfig.images ) + '"';
            }

            if ( compassConfig.outputStyle !== undefined ) {
                command += ' --output-style ' + compassConfig.outputStyle;
            }

            if ( compassConfig.lineComments === false ) {
                command += ' --no-line-comments';
            }

            if ( compassConfig.force === true ) {
                command += ' --force';
            }

            if ( compassConfig.importPath !== undefined ) {

                if( _.isString( compassConfig.importPath ) ){
                    compassConfig.importPath = [ compassConfig.importPath ];
                }

                compassConfig.importPath.forEach(function( importPath ){
                    command += ' -I ' + importPath;
                });
            }

            function output( error, stdout, stderr ) {

                console.log( '\n\nCompass output:\n' );
                console.log( stdout );

                // Debug info 是从这边输出的
                console.log( stderr );

                if ( error !== null ) {
                    console.error( error );
                    next(error);
                }
                else {
                    next(null);
                }
            }

            Exec( command, output );

        });
    }
};