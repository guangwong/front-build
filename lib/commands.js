var fs = require('fs');
var path = require('path');
var async = require('async');
var App = require('../lib/app');
var util = require('util');
var optimist = require('optimist').argv


module.exports = {
    init: function(bin, callback) {
        var target;

        if(bin.argv._.length >= 2 ) {
            target = path.resolve(bin.argv._[1]);
        } else {
            target = bin.cwd;
        }

        App.init(target, callback);
    },

    /**
     * fb build pagenname@pageversion -t 1000
     */

    build: function(bin, callback){
        var argv = bin.argv;
        var jobs = [];
        
        var date = new Date();

        App.getApp(bin.cwd, function(err, app){
            if (err) {
                return callback(err);
            }

            if (!app) {
                App.error('不在FB项目，请先初始化！');
                return callback(new Error('build fail, not a fb app;'));
            }

            if (argv._.length >= 2) {
                pageName = argv._[1];
            }

            var targets = argv._.slice(1);

            if (targets.length === 0) {
                targets.push('');
            }

            async.forEach(targets, function (target, callback) {
                var page;
                var pageName;
                var timestamp;
                var version;

                if (target === 'common') {
                    app.buildCommon(callback);
                } else {
                    version = argv.version;
                    timestamp = argv.timestamp;
                    if (target && target.indexOf('@') > -1) {
                        var p = target.split('@');
                        pageName = p[0];
                        version = p[1];
                    }

                    var current = app.getCurrent();
                    if (!pageName && current.pageName) {
                        pageName = current.pageName;
                    }
                    if (!timestamp) {
                        timestamp = util.format('%d%d%d', date.getFullYear(), date.getMonth() + 1, date.getDate())
                    }

                    if (!version) {
                        if (current.version) {
                            version = current.version;
                        } else {
                            version = '1.0';
                        }
                    }
                    if (!pageName || !version) {
                        return callback(new Error('command.build: no pageName or version!'));
                    }

                    page = app.getPage(pageName);

                    page.setVersion(version, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        jobs.push({
                            page: page,
                            timestamp: timestamp
                        });
                        callback(null);
                    });
                }
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                async.forEachSeries(jobs, function(job, callback){
                    page.build(job.timestamp, callback);
                }, callback);
            });



        });
    },
     
    version: function(bin, callback) {
        App.getApp(bin.cwd, function(err, app){
            var query = {};
            var page;
            var argv = bin.argv;
            var version = bin.argv._[1];

            if (err) {
                return callback(err);
            }

            if (argv._.length >= 2) {
                query.version = argv._[1];
            }

            page = app.getPage(app.getCurrent().pageName);
            page.addVersion(version, callback);
        });
    },

    addpage: function(bin, callback) {
        var cwd = bin.cwd;
        var argv = bin.argv;

        App.getApp(cwd, function(err, app){
            if (err) {
                return done(err);
            }
            if (!app) {
                console.error('不在FB项目，请先初始化！')
                return done(new Error('not a fb app'));
            }
            app.addPage(argv._[1], callback);
        });
    }
};