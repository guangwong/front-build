var fs = require('fs');
var path = require('path');
var async = require('async');
var App = require('../lib/app');
var util = require('util');
var optimist = require('optimist').argv;

function parsePage(sPage) {
    var obj = {};

    if (sPage && sPage.indexOf('@') > -1) {
        var p = sPage.split('@');

        if (p[0]) {
            obj.pageName = p[0];
        }
        if (p[1]) {
            obj.version = p[1];
        }
    }

    return obj;
}


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
                    parsed = parsePage(target);

                    pageName = parsed.pageName;
                    version = parsed.version || version;

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
                return callback(err);
            }
            if (!app) {
                console.error('不在FB项目，请先初始化！')
                return callback(new Error('not a fb app'));
            }
            app.addPage(argv._[1], callback);
        });
    },

    help: require('./command-help'),

    group: function(bin, callback) {
        var argv = bin.argv;
        var cwd = bin.cwd;
        var groupNameReg =  /^[_a-z0-9][-_a-z0-9]*$/i;
        var pageReg = /^[_a-z0-9]@(\d+\.)+(\d)+$/i;
        App.getApp(cwd, function (err, app) {
            var config = app.config;

            if (err) {
                return callback(err);
            }

            if (argv._.length === 1 ) {
                //print all groups
                return callback();
            } else {
                var command = argv._[1];
                var error = null;
                var groupName;
                var pages;

                switch(command) {
                    case 'ls':
                    case 'list':
                        //print all groups
                        if (config.groups) {
                            for (k in config.groups) {
                                console.log('%s: %s', k, config.groups[k].join(', '));
                            }
                        }
                        break;
                    case 'add':
                        //check page
                        groupName = argv._[2];

                        if (!groupNameReg.test(groupName)) {
                            return callback(new Error('not valid groupname: ' + groupName));
                        }

                        if (argv._.length < 4) {
                            return callback(new Error('set group with no page'));
                        }
                        pages = argv._.slice(3);
                        pages.forEach(function (page) {
                            if (!pageReg.test(page)) {
                                error = new Error(page + 'is not a valid page');
                                return false;
                            }
                        });

                        if (!config.groups) {
                            config.groups = {};
                        }
                        if (!config.groups[groupName]) {
                            config.groups[groupName] = [];
                        }
                        config.groups[groupName] = config.groups[groupName].concat(pages);

                        console.log('%s: %s', groupName, config.groups[groupName].join(', '));
                        app.saveConfig(callback);
                        break;

                    case 'set':
                        groupName = argv._[2];

                        if (!groupName) {
                            return callback(new Error('no groupName'));
                        }
                        if (!groupNameReg.test(groupName)) {
                            return callback(new Error('not a valid groupName'));

                        }

                        pages = argv._.slice(3);
                        
                        pages.forEach(function (page) {
                            if (!pageReg.test(page)) {
                                error = new Error(page + 'is not a valid page');
                                return false;
                            }
                        });

                        if (error) {
                            return callback(error);
                        }

                        if (!config.groups) {
                            config.groups = {};
                        }

                        config.groups[groupName] = pages;

                        console.log('%s: %s', groupName, config.groups[groupName].join(', '));

                        app.saveConfig(callback);
                        break;
                    case 'rm':
                    case 'del':
                    case 'remove':
                    case 'delete':

                        groupName = argv._[2];

                        if (!groupName) {
                            return callback(new Error('no groupName'));
                        }
                        if (!config.groups || !config.groups[groupName]) {
                            return callback(new Error('group not found'));
                        }
                        delete config.groups[groupName];

                        app.saveConfig(callback);
                        break;



                    case 'build':
                        groupName = argv._[2];
                        if (!groupName) {
                            return callback(new Error('no groupName'));
                        }

                        if (!groupNameReg.test(groupName)) {
                            return callback(new Error('not a valid groupName'));
                        }

                        if (!config.groups[groupName]) {
                            return callback(new Error('group not found'));
                        }

                        if (config.groups[groupName].length < 0) {
                            return callback(new Error('group empty'));
                        }
                        var timestamp = argv.timestamp;

                        if (!timestamp) {
                            return callback(new Error('no timestamp for build'));
                        }

                        if (!/^\d{6,}$/.test(timestamp)) {
                            return callback(new Error('timestamp format error; '))
                        }

                        async.forEach(config.groups[groupName], function (page, callback) {
                            var parsed = parsePage(page);

                            if (!parsed.pageName || !parsed.version) {
                                return callback(new Error('page name or page Version is not defined'));
                            }

                            var page = app.getPage(parsed.pageName);

                            page.setVersion(parsed.version, function (err){
                                if (err) {
                                    return callback(err);
                                }
                                page.build(timestamp, callback);
                            });

                        }, callback);
                        break;


                }
            }

        });
    }
};