var fs = require('fs');
var path = require('path');
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
        var argv = bin.argv,
            query = {},
            pageName,
            page,
            timestamp,
            version;

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

            version = argv.version;

            

            // if (argv._[3]) {
            //     timestamp = argv._[3];
            // }  else if (argv.timestamp) {
            //     query.timestamp = argv.timestamp;
            // } else {
            //     var data = new Date();
            //     timestamp = util.format('%d%d%d', data.getFullYear(), data.getMonth()+1, data.getDate());
            // }
            timestamp = argv.timestamp;

            if (pageName && pageName.indexOf('@') > -1) {
                var p = pageName.split('@');
                pageName = p[0];
                version = p[1];
            }

            var current = app.getCurrent();

            version = version || current.version;
            pageName = pageName || current.pageName;

            if (!pageName) {
                return callback(new Error('command.build: no pageName'))
            }

            page = app.getPage(pageName);

            page.setVersion(version, function (err) {
                if (err) {
                    return callback(err);
                }
                console.log(timestamp);
                page.build(timestamp, callback);
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