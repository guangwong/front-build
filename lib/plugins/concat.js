/**
 * File Concat Plgin for FrontBuild
 * concat files by config
 * @author <maxbbn qipbbn@gmail.com>
 */

var fu = require('../fileutil');
var path = require('path');
var _ = require('underscore');
var async = require('async');
var fs = require('fs');

function doConcat (job, callback) {
    var target = job.output;
    var files = job.files;

    if(!target || !files || !files.length) {
        console.warning('file missing');
        return callback(null);
    }

    var ws = fs.createWriteStream(target, {
        start: 0
    });

    async.forEachSeries(
        files, 

        function(file, callback){
            fs.readFile(file, function(err, data){
                var rs = fs.createReadStream(file);
                rs.on('end', callback);
                rs.pipe(ws, {end: false});
            });
        },

        function (err) {
            if (err) {
                return callback(err);
            }
            ws.end();
            callback(null);
        }
    );

}

module.exports = function(){
    return function (page, next) {
        var logtext = 'plugin concat: %s';
        console.log('plugin: concat');
        var config = page.config;
        var jobs = [];
        if (!config || !config.concat || !config.concat.length === 0) {
            // console.log(logtext, 'no concat job, existing');
            return next(null);
        }

        //parse concat
        _.each(config.concat, function (list, to){
            if(!to) {
                console.log(logtext, 'no target for concat');
                return;
            }
            //map
            if (list instanceof Object) {
                list = list
                    .filter(function(file){
                        return (typeof file === 'string') && (file.trim().length > 0)
                    })
                    .map(function(file){
                        return path.resolve(page.srcDir, file);
                    });
            }

            if(list.length === 0 ) {
                console.log(logtext, 'no file for concat')
                return;
            }

            jobs.push({
                output: path.resolve(page.destDir, to),
                files: list
            });
        });

        async.forEach(jobs, doConcat, next);

    }
};