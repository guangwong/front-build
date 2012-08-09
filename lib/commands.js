var fs = require('fs');
var path = require('path');
var async = require('async');
var App = require('../lib/app');
var Page = require('../lib/page');
var util = require('util');
var watchDir = require('./watchdir');
var os = require('os');




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
                return callback(err);
            }

            callback(null, 'success!');
        });
    },

    web: function (bin, callback) {
        var querystring = require('querystring');
        var http = require('http');
        var cp = require('child_process');

        var domain = 'http://127.0.0.1:8765';
        var url;
        //检查是否在应用目录下
        App.getApp(bin.cwd, function(err, app) {
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
                startWeb(url);
            }).on('error', function (e) {
                console.log('starting server...');

                var child = cp.fork(path.resolve(__dirname, '../server/app.js'), [], {
                    env : {
                        // 'NODE_ENV': 'production' 
                        'NODE_ENV': 'development'
                    }
                });

                setTimeout(function () {
                    startWeb(url);
                }, 300);
            });
        });

        function startWeb (url) {
            switch (os.platform()) {
                case 'win32':
                    console.log('opening...');
                    cp.exec('start ' + url);
                    break;
                case 'darwin':
                    console.log('opening...');
                    cp.exec('open ' + url);
                    break;
                default:
                    console.log('please open %s in your browser', url);
            }
        }


    },

    update: function(bin, callback) {
        var argv = bin.argv;
        App.getApp(bin.cwd, function(err, app) {
            if (err) {
                return callback(err);
            }

            if (!app) {
                console.error('不在FB项目，请先初始化！');
                return callback(new Error('build fail, not a fb app;'));
            }

            if (app.config.fbversion || app.config.version) {
                console.log('FB app fbversion was %s',
                    app.config.fbversion || app.config.version);
            }

            if (app.rootDir != bin.cwd) {
                console.error('请在FB项目根目录执行此命令');
                return callback(new Error('not fb root'));
            }

            app.update(function (err) {
                if (err) {
                    return callback(err);
                }
                console.log('Update success! Current fbversion is %s',
                    app.config.fbversion);
                callback(null, 'success');
            });


        });
    },

    /**
     * fb build pagenname/pageversion -t 20120555
     */

    build: function(bin, callback) {
        var argv = bin.argv;
        var jobs = [];

        var date = new Date();

        App.getApp(bin.cwd, function (err, app) {
            if (err) {
                return callback(err);
            }

            if (!app) {
                console.error('不在FB项目，请先初始化！');
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

                if (target === 'common') {
                    app.buildCommon(callback);
                } else {
                    var parsed = Page.parsePageVersion(target);
                    var current = app.getCurrent();

                    var version = parsed.version || argv.version || current.version;

                    var pageName = parsed.name || current.pageName;

                    if (!pageName || !version) {
                        var error = new Error('command.build: no pageName or version!');
                        return callback(error);
                    }
                    var page = app.getPage(pageName);

                    var timestamp = argv.timestamp;

                    async.series([
                        function (callback) {

                            if (timestamp) {
                                return callback();
                            }

                            page.getTimestamps(function (err, timestamps) {

                                if (err) {
                                    return callback(err);
                                }
                                if (timestamps.length === 0) {
                                    return callback(new Error('command.build: no timestamp!'));
                                }

                                timestamp = timestamps[timestamps.length - 1];
                                
                                return callback();
                            });
                        },
                        
                        function (callback) {
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
                    ], callback);

                }
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                var utilswd = watchDir(app.getUtilsDir());

                async.forEachSeries(jobs, function (job, callback) {
                    if (argv.watch) {
                        var wd = watchDir(job.page.versionDir);

                        job.page.build(job.timestamp, function (err) {
                            if (err) {
                                console.error(err);
                            }
                            console.log('watching...');
                            //is change enough
                            wd.on('change', function (file) {
                                job.page.build(job.timestamp, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                });
                                console.log('watching...');
                            });

                            utilswd.on('change', function (files) {
                                job.page.build(job.timestamp, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    console.log('watching...');
                                });
                            })
                        });

                    } else {
                        job.page.build(job.timestamp, callback);
                    }
                }, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, 'success!');
                });
            });



        });
    },

    version: function(bin, callback) {
        App.getApp(bin.cwd, function (err, app) {
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
        });
    },

    version: function (bin, callback) {
        console.log('fb version Commond is already removed , please use "fb add pagename/version" instand');
        callback(new Error('command not exist'));
    },

    addpage: function(bin, callback) {
        var cwd = bin.cwd;
        var argv = bin.argv;

        App.getApp(cwd, function (err, app) {
            if (err) {
                return callback(err);
            }
            if (!app) {
                console.error('不在FB项目，请先初始化！');
                return callback(new Error('not a fb app'));
            }

            app.addPage(argv._[1], function (err) {

                if (err) {
                    return callback(err);
                }
                callback(null, 'success!');

            });

        });
    },

    help: require('./command-help'),

    group: function(bin, callback) {
        var argv = bin.argv;
        var cwd = bin.cwd;

        App.getApp(cwd, function (err, app) {
            if (err) {
                return callback(err);
            }

            if (!app) {
                return callback(new Error('not in a fb project!'));
            }

            var command = argv._[1] || 'list';

            var config = app.config;

            var error = null;
            var groupName;
            var pages;

            switch (command) {
                case 'ls':
                case 'list':
                    //print all groups
                    app.getGroups(function (err, groups) {
                        if (err) {
                            return callback(err);
                        }

                        if(!groups) {
                            return callback(null);
                        }

                        for (k in groups) {
                            console.log('%s: %s',
                                k, 
                                config.groups[k].join(', '));
                        }

                        callback(null);

                    });
                    break;

                case 'add':
                    //check page
                    groupName = argv._[2];

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
                    groupName = argv._[2];

                    app.getGroup(groupName, function (err, pages) {
                        if (err) {
                            return callback(err);
                        }

                        if (!pages || pages.length === 0) {
                            return callback(new Error('no group'));
                        }

                        pages.forEach(function (page) {
                            console.log(page);
                        });

                        callback(null);
                    });
                    break;

                case 'rm':
                case 'del':
                case 'remove':
                case 'delete':
                    groupName = argv._[2];
                    app.rmGroup(groupName, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, 'success!');
                    });
                    break;
                case 'build':
                    groupName = argv._[2];

                    if (!groupName) {
                        return callback(new Error('no groupName'));
                    }

                    var timestamp = argv.timestamp;

                    if (!timestamp) {
                        return callback(new Error('no timestamp for build'));
                    }

                    if (!/^\d{6,}$/.test(timestamp)) {
                        return callback(new Error('timestamp format error; '));
                    }

                    app.buildGroup(groupName, timestamp, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, 'success!');
                    });
                    break;

            }

        });
    }
};