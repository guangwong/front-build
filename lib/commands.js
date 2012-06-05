var fs = require('fs');
var path = require('path');
var App = require('../lib/app');
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
            page;

        App.getApp(bin.cwd, function(err, app){
            if (err) {
                return callback(err);
            }
            if (!app) {
                App.error('不在FB项目，请先初始化！');
                return callback(new Error('build fail, not a fb app;'));
            }
            if (argv._.length >= 2) {
                query.page = argv
            }
            var page = app.getPage();
        });


        var page = argv._.length >= 2 ?  : app.page,
            rootdir = app.dir;
        

        if (!page) {
            console.log('No page given!');
            process.exit(2);
        }

        if (argv.version) {
            page.version = argv.version;
        }

        if (argv.timestamp) {
            page.timestamp = argv.timestamp;
        }

        app.page = page;
    },
    
    version: function(bin, callback) {
        argv = require('optimist')
            .string('_')
            .argv
        fb.version(argv, app, done);
    },

    addpage: function(bin, callback) {
        App.getApp(cwd, function(err, app){
            if (err) {
                return done(err);
            }
            if (!app) {
                App.error('不在FB项目，请先初始化！')
                return done(new Error('not a fb app'));
            }
        });
        app.add(argv._[1], app, done);
    }
};