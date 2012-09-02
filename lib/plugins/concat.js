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

var lineEnds = {
    dos: '\r\n',
    unix: '\n',
    mac: '\r'
};


function doConcat (job, callback) {
    var target = job.output;
    var files = job.files;
    var lineEndBuf = new Buffer(job.lineEnd || '\n');

    if(!target || !files || !files.length) {
        console.warning('file missing');
        return callback(null);
    }

    fu.mkdirp(path.dirname(target), function(err){
        if (err) {
            return callback(err);
        }
        
        var ws = fs.createWriteStream(target, {
            start: 0
        });
        

        async.filter(files, function (file, callback) {
            fs.lstat(file.path, function (err, stat) {
                callback(!err && stat.isFile());
            });
        }, function (files) {
            async.forEachSeries(
                files,
                function(file, callback) {
                    var rs = fs.createReadStream(file.path);

                    rs.on('end', function (ev) {
                        ws.once('drain', callback);
                        ws.write(lineEndBuf);
                    });

                    rs.pipe(ws, {end: false});
                },

                function (err) {
                    if (err) {
                        return callback(err);
                    }
                    ws.end();
                    callback(null, job);
                }
            );
            
        });


    });


}

module.exports = function(config){

    config = _.defaults(config, {
        base: ''
    });

    return function (page, next) {
        var logtext = 'plugin concat: %s';
        var report = {
            name: 'concat',
            jobs: []
        }
        var srcBase = path.resolve(page.srcDir, config.base);
        var buildBase = path.resolve(page.destDir, config.base);

        var pageCfg = page.config;
        var fileFormat = pageCfg.fileFormat || 'unix';

        var lineEnd = lineEnds[fileFormat];

        var jobs = [];
        if (!pageCfg || !pageCfg.concat || !pageCfg.concat.length === 0) {
            // console.log(logtext, 'no concat job, existing');
            return next(null, report);
        }

        //parse concat
        _.each(pageCfg.concat, function (list, to){
            //no target for concat
            if(!to) {
                return;
            }
            var filelist;

            //map
            if (list instanceof Object) {
                filelist = list
                    .filter(function(file){
                        return (typeof file === 'string') && (file.trim().length > 0)
                    })
                    .map(function(file){
                        return {
                            filename: file,
                            path: path.resolve(srcBase, file)
                        };
                    });
            }
            //no file for concat
            if(list.length === 0 ) {
                return;
            }

            jobs.push({
                output: path.resolve(buildBase, to),
                filename: to,
                files: filelist,
                lineEnd: lineEnd
            });
        });

        async.map(jobs, doConcat, function (err, jobs) {
            if (err) {
                return next(err);
            }
            report.jobs = jobs;
            next(null, report);
        });

    }
};