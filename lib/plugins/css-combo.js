var CssCombo = require('css-combo');
var fu = require('../fileutil');
var path = require('path');
var async = require('async');

module.exports = function(){
    return function (page, next) {
        var src_core_dir = path.resolve(page.temp_src_dir, 'core');
        var build_core = path.resolve(page.temp_build_dir, 'core');
        //todo ensure dir exist?
        fu.findInDir(src_core_dir, /.*\.css$/, function(err, files){
            async.forEach(files, function (cssfile, callback){
                CssCombo.build({
                    target: path.resolve(src_core_dir, cssfile),
                    inputEncoding: 'utf8',
                    outputEncoding: 'utf8',
                    debug: page.debug,
                    output: path.resolve(page.temp_build_dir, 'core')
                }, callback);
            }, next);
        });
    }
};