var fs = require('fs');
var path = require('path');
var async = require('async');
var App = require('../lib/app');
var Page = require('../lib/page');
var util = require('util');
var errorHelper = require('./error-helper');
var colors = require('colors');

//统计
//var os = require('os');
//var analytics = require('analytics-node');
//analytics.init({secret: 'd773djzygv3epa4go4ue'});
//var userId = os.hostname() + '-' + os.totalmem() + '-' + os.cpus() + '-' + os.release() + '-' + os.platform();
//analytics.identify({
//    userId : userId,
//    traits : {
//        hostName: os.hostname(),
//        totalMem: os.totalmem(),
//        cpus: os.cpus(),
//        release: os.release(),
//        platform: os.platform()
//    }
//});

function track(event, properties) {
    return;
    properties = properties || {};

    properties.platform = 'node';

    analytics.track({
        userId: userId,
        event: event,
        properties: properties
    });
}

function getTime() {
    var date = new Date();
    return util.format('[%s:%s:%s]', date.getHours(), date.getMinutes(), date.getSeconds());
}

module.exports = {
    init: function(bin, callback) {
        var target;

        if (bin.argv._.length >= 2) {
            target = path.resolve(bin.argv._[1]);
        } else {
            target = bin.cwd;
        }
        
        App.init(target, function (err, logs) {



            if (err) {
                callback(err);
                return;
            }

            console.log('Dirs:'.green);

            logs.dirs.forEach(function(dir){
                console.log('  %s [%s]', dir.filename, dir.status);
            });

            console.log('Files:'.green);

            logs.files.forEach(function(file){
                console.log('  %s [%s]', file.filename, file.status);
            });

            track('init');
            callback(null, 'success!');
        });


    },

    web: function (bin, callback) {
        var querystring = require('querystring');
        var http = require('http');
        var commendOpen = require('./command-open');
        var cp = require('child_process');

        var domain = 'http://127.0.0.1:8765';
        var url;

        //检查是否在应用目录下
        App.getApp(bin.cwd, function(err, app) {
            track('web');
            if (err) {
                return callback(err);
            }
            //如果是，打开应用的地址，否则打开入口页
            if (app) {
                url = domain + '/app?' + querystring.stringify({
                    root: app.rootDir
                });
            } else {
                url = domain;
            }

            //检查服务器是否开启
            http.get(domain + '/pid', function (res) {
                commendOpen(url, callback);
            }).on('error', function (e) {
                console.log('starting server...');
                var child = cp.fork(path.resolve(__dirname, '../server/app.js'), [], {
                    env : {
                        'NODE_ENV': 'production'
                    }
                });

                setTimeout(function () {
                    commendOpen(url, callback);
                }, 300);
            });
        });

    },

    update: function(bin, callback) {

        track('update');

        App.getApp(bin.cwd, function(err, app) {

            if (err) {
                return callback(err);
            }
            var updateError;



            if (!app) {
                updateError = new Error('不在FB项目，请先初始化！');
                updateError.name = 'E_UPDATE';
                return callback(updateError);
            }

            if (app.rootDir != bin.cwd) {
                updateError = new Error('请在 KissyPie 项目根目录执行此命令');
                updateError.name = 'E_UPDATE';
                return callback(updateError);
            }

            app.update(function (err) {

                if (err) {
                    return callback(err);
                }
                console.log('App Update success! Current fbversion is %s', app.config.fbversion);
                callback(null, 'success!');
            });


        });
    },

    /**
     * fb build pagenname/pageversion -t 20120555
     */

    build: function(bin, callback) {
        var argv = bin.argv;
        var timestamp = argv.timestamp;
        var buildError = new Error();
        buildError.name = 'E_BUILD';

        App.getApp(bin.cwd, function (err, app) {
            if (err) {
                track('error', {
                    target: 'build',
                    err: err
                });
                callback(err);
                return
            }

            if (!app) {
                buildError.message = 'build fail, not a fb app';
                callback(buildError);
                return;
            }

            var targets = argv._.slice(1);

            if (targets.length === 0) {
                var current = app.getCurrent();
                if (current.pageName && appcurrent.version) {
                    targets.push(current.pageName + '/' + current.version);
                } else {
                    buildError.message = 'no target!';
                    callback(buildError);
                    return;
                }
            }

            var pages = targets.filter(function (item) {
                return item != 'common';
            });

            track('Build', {
                length: pages.length,
                hasCommon: targets.indexOf('common') > -1
            });

            async.series([
                //common build
                function (callback) {
                    if (targets.indexOf('common') > -1) {

                        if(argv.watch) {

                            function watching () {
                                console.log('watching...'.cyan);
                                console.log('  common');
                            }



                            app.autoBuildCommon();

                            app.on('common_build_error', function (err) {
                                errorHelper.printError(err);
                                watching();
                            });

                            app.on('common_build_success', function (reporter) {
                                var out = util.format('build common success %s', getTime().grey);
                                console.log();
                                console.log(out.underline);
                                watching();
                            });
                            watching();

                            return;
                        }

                        app.buildCommon(callback);


                    } else {
                        callback(null);
                    }
                },


                //ki build page1/1.0 page2/1.0 -t xxxxxxxx
                function (callback) {
                    if (pages.length) {
                        app.buildPages(pages, timestamp, function (err, reporters) {
                            if (err) {
                                return callback(err);
                            }
                            // TODO output reporters

                            if (argv.watch) {

                                var fbPages = pages.map(function(target) {
                                    var parsed = Page.parsePageVersion(target);
                                    return app.getPage(parsed.name, parsed.version);
                                });

                                function watching () {
                                    console.log('watching...'.cyan)
                                    console.log('  utils');
                                    pages.forEach(function(p){
                                        console.log('  %s', p);
                                    });
                                }

                                watching();

                                fbPages.forEach(function (page) {
                                    page.startAutoBuild(timestamp);

                                    page.on('build_fail', function (err) {
                                        errorHelper.printError(err);
                                        watching();
                                    });
                                    page.on('watch_error', function (err) {
                                        errorHelper.printError(err);
                                        watching();
                                    });

                                    page.on('build_success', function (reporter) {

                                        var out = util.format('build %s/%s to %s %s', page.name, page.version, page.timestamp, getTime().grey);
                                        console.log();
                                        console.log(out.underline);
                                        watching();
                                    });
                                });


                            } else {
                                callback(null);
                            }
                        });

                    } else {
                        callback(null);
                    }
                }],

                function (err, results) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, 'success');
                }
            );
        });
    },

    /**
     * Add page to current app
     * command:fb add page1/1.0
     * @param  {Object}   bin      command object
     * @param  {Function} callback callback with an error or null
     */
    addPage: function(bin, callback) {
        var cwd = bin.cwd;
        var argv = bin.argv;

        App.getApp(cwd, function (err, app) {
            track('Add Page');
            if (err) {
                callback(err);
                return;
            }
            if (!app) {
                console.error('不在FB项目，请先初始化！');
                return callback(new Error('not a fb app'));
            }

            app.addPage(argv._[1], function (err, logs) {

                if (err) {
                    callback(err);
                    return;
                }
                callback(null, 'success!');

            });

        });
    },

    'help': require('./command-help'),

    group: function(bin, callback) {
        var argv = bin.argv;
        var cwd = bin.cwd;

        App.getApp(cwd, function (err, app) {
            if (err) {
                callback(err);
                return;
            }


            if (!app) {
                callback(new Error('not in a fb project!'));
                return;
            }

            var command = argv._[1] || 'list';

            var config = app.config;

            var groupName;
            var pages;

            switch (command) {
                case 'ls':
                case 'list':
                    //print all groups
                    app.getGroups(function (err, groups) {
                        if (err) {
                            callback(err);
                            return;
                        }

                        if(!groups) {
                            callback(null);
                            return;
                        }

                        for (k in groups) {
                            console.log('%s: %s',k, config.groups[k].join(' '));
                        }

                        callback(null);

                    });
                    track('Group List', {
                        command: argv._[1]
                    });
                    break;

                case 'add':
                    //check page
                    groupName = argv._[2];

                    track('Group Add', {
                        command: argv._[1]
                    });

                    if (argv._.length < 4) {
                        return callback(new Error('set group with no page'));
                    }

                    pages = argv._.slice(3);

                    app.getGroup(groupName, function (err, prev_pages) {
                        if (err) {
                            return app.setGroup(groupName, pages, callback);
                        }

                        if (prev_pages) {
                            pages = prev_pages.concat(pages);
                        }

                        var groups = config.groups[groupName].concat(pages);
                        app.setGroup(groupName, groups, function (err) {
                            if (err) {
                                return callback(err);
                            }

                            console.log('%s: %s',
                                groupName,
                                config.groups[groupName].join(' '));
                            callback(null);
                        });
                    });

                    break;

                case 'set':
                    groupName = argv._[2];
                    track('Group Build', {
                        command: argv._[1]
                    });

                    if (argv._.length < 4) {
                        return callback(new Error('no page'));
                    }

                    pages = argv._.slice(3);

                    app.setGroup(groupName, pages, function () {
                        console.log('%s: %s',
                            groupName,
                            config.groups[groupName].join(', '));
                        app.saveConfig(function (err) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, 'success!');
                        });
                    });
                    break;
                case 'get':
                case 'show':
                    track('Group Get', {
                        command: argv._[1]
                    });
                    groupName = argv._[2];

                    app.getGroup(groupName, function (err, pages) {
                        if (err) {
                            return callback(err);
                        }

                        if (!pages || pages.length === 0) {
                            return callback(new Error('no group'));
                        }

                        console.log(page.join(' '));

                        callback(null);
                    });
                    break;

                case 'rm':
                case 'del':
                case 'remove':
                case 'delete':
                    track('Group Rm', {
                        command: argv._[1]
                    });

                    groupName = argv._[2];
                    app.rmGroup(groupName, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, 'success!');
                    });
                    break;
                case 'build':

                    track('Group Build', {
                        command: argv._[1]
                    });

                    app.buildGroup(argv._[2], argv.timestamp, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, 'success!');
                    });
                    break;

            }

        });
    },

    analyze: function(bin, callback) {
        var argv = bin.argv;
        var cwd = bin.cwd;
        App.getApp(cwd, function (err, app) {
            if (err) {
                callback(err);
                return;
            }
            track('Group analyze');

            if (!app) {
                console.error('不在FB项目，请先初始化！');
                callback(new Error('not a fb app'));
                return
            }

            app.analyze(function (err, reports) {
                if (err) {
                    callback(err);
                    return;
                }
                reports.forEach(function (page) {
                    console.log(util.format('%s %s/%s', '[P]', page.name, page.version).underline);

                    if (page.report) {
                        var modules = page.report.modules;

                        if (!modules.length) {
                            console.log('  此页面没有入口模块');
                            return;
                        }

                        modules.forEach(function (mod) {
                            console.log('  %s %s',"[M]", mod.name);
                            if (!mod.mods.length) {
                                console.log('    没有子模块');
                            }
                            mod.mods.forEach(function(submod){
                                if (submod.status == 'ok') {
                                    console.log('    - %s', submod.name.green);
                                }
                                else {
                                    console.log('    - %s (missing)', submod.name.red);
                                }
                            });

                        });
                    }

                });
            });

        });
    }
};