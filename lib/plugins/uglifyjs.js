var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var path = require('path');
var fu = require('../fileutil');
var jsp = require('uglify-js').parser;
var pro = require('uglify-js').uglify;

function uglify(from_file, to_file, options,  done) {
    
    fs.readFile(from_file, 'utf8', function (err, content) {
        if (err) {
            done(err);
            return;
        }

        var compressed; 
        var ast;

        try {
            ast = jsp.parse(content);
            ast = pro.ast_mangle(ast, options.ast_mangle);
            ast = pro.ast_squeeze(ast, options.ast_squeeze);
            compressed = pro.gen_code(ast, options.gen_code);
        } catch (ex) {
            ex.message = ex.message + ' [' + from_file + ']';
            done(ex);
            return;
        }

        compressed += '; ';
        fs.writeFile(to_file, compressed, done);
    });
}

/**
 * plugin uglifyjs for FrontBuild
 * only build the temp_build dir
 * minify xx.js to xx-min.js
 */
module.exports = function () {
    // plugin default options
    var options = {
        ast_mangle: {

        },
        ast_squeeze: {
            make_seqs: true,    //which will cause consecutive statements in a block
                                // to be merged using the “sequence” (comma) operator
            dead_code: true     //which will remove unreachable code.
        },
        gen_code: {
            beautify: false,
            quote_keys: false,
            ascii_only: true
        }
    };

    return function (page, next) {
        var reports = {
            name: 'uglifyjs',
            files: []
        };

        var minReg = /.+-min\.js$/i;
        var jsReg = /.+\.js$/i;
        var dir = page.destDir;

        var pluginConfig;

        if (page.config.plugins && page.config.plugins.uglifyjs) {
            pluginConfig = page.config.plugins.uglifyjs;

            _.chain(options)
                .keys()
                .each(function(key){
                    if (key in pluginConfig) {
                        _.defaults(pluginConfig[key], options[key]);
                    } else {
                        pluginConfig[key] = options[key];
                    }
                })
        } else {
            pluginConfig = _.clone(options);
        }


        fu.findInDir(dir, jsReg, function(err, list){
            if (err) {
                next(err);
                return;
            }
            
            //去掉压缩版的
            list = _.filter(list, function(p){
                return !minReg.test(p);
            });

            async.forEach(list, function(file, callback) {
                reports.files.push(file);
                var from_file = path.resolve(dir, file);
                var to_file = from_file.replace(/\.js$/i, '-min.js');
                uglify(from_file, to_file, pluginConfig, callback);

            }, function (err) {
                if (err) {
                    next(err);
                    return;
                }
                next(null, reports);
            });
        });
    };
};
    