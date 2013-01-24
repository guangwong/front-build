var _ = require('underscore');
var iconv = require('iconv-lite');
var fs = require('fs');
var util = require('util');
var path = require('path');
var async = require('async');
var fu = require('./fileutil');
var events = require('events');
var WatchDir = require('./watchdir');
var ModuleCompiler = require('module-compiler');



/**
 * class Page
 * @param cfg
 * @constructor
 */
function Page(cfg) {
    var self = this;
    self.app = cfg.app || null;
    self.name = cfg.name;

    // rootDir is the path of page, not the  version
    self.rootDir = path.resolve(cfg.rootDir);
    self.version = cfg.version;
    self.versionDir = path.join(self.rootDir, self.version);

    self.pageDir = path.join(self.versionDir, Page.BASE_DIR_NAME);

    self._plugins = [];
    self.srcDir = path.resolve(self.rootDir, Page.TEMP_SOURCE_NAME);
    self.destDir = path.resolve(self.rootDir, Page.TEMP_DEST_NAME);
    self._build_targets = {};

    self.buildQueue = async.queue(function(task, callback) {
        self._initBuild(function(err) {
            if (err) {
                return callback(err);
            }
            self._buildTarget(task, callback);
        });
    }, 1);
}

module.exports = Page;

_.extend(Page, /** @lends Page */{
    TEMP_SOURCE_NAME: 'page_src_temp',
    TEMP_DEST_NAME: 'page_build_temp',
    JSON_NAME: 'fb.page.json',
    BUILD_SH: 'fb-build.sh',
    BUILD_BAT: 'fb-build.bat',
    BUILD_JSON_NAME: 'build.json',
    DIRS: ['page', 'test', 'page/mods'],
    DEFAULT_JS: 'page/init.js',
    DEFAULT_LESS: 'page/index.less',
    DEFAULT_CSS: 'page/index.css',
    BASE_DIR_NAME: 'page',

    /**
     * parser page_version string to object
     * @param  {string} page_version str of page/version
     * @return {Object}              an obj with name and version
     */
    parsePageVersion: function(page_version) {
        var pvReg = /^(\w[\w\-~]*)[@/\\](\d+(\.\d+)+)[/\\]?$/;
        var match = pvReg.exec(page_version);

        if (!match) {
            return null;
        }

        return {
            name: match[1],
            version: match[2]
        };
    },

    /**
     * check if timestamp is valid
     * @param {String} timestamp timestamp to check
     * @return {Boolean} true if valid
     */
    testTimestamp: function (timestamp) {
        var result = false;
        if (!timestamp) return false;
        if (/^\d\d\d\d\d\d(\d\d)?(_[A-z0-9_-]+)?$/.test(timestamp) ||
            /^pub_[A-z0-9_-]+$/.test(timestamp) ) {
            result = true;
        }
        return result;
    }


});

_.extend(Page.prototype, events.EventEmitter.prototype, {

    /**
     * get all timestamps of current page
     * @param  {Function} callback call back with  array of obj
     *                             obj.timestamp 时间戳
     *                             obj.build build.json
     */
    getTimestamps: function (callback) {
        var self = this;
        var rootDir = self.rootDir;
        fs.readdir(rootDir, function (err, files) {
            if (err) {
                return callback(err);
            }

            var timestamps = [];

            async.forEach(files, function (dirname, callback) {

                fs.stat(path.resolve(rootDir, dirname), function (err, stat) {

                    if (err || !stat.isDirectory()) {
                        return callback(false);
                    }

                    if (!Page.testTimestamp(dirname) ) {
                        return callback(false);
                    }

                    fu.readJSON(path.resolve(rootDir, dirname, Page.BUILD_JSON_NAME), function (err, obj) {
                        timestamps.push({
                            timestamp: dirname,
                            build: err ? null : obj
                        });
                        callback();
                    });
                });
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, timestamps);
            });
        });
    },

    /**
     * get Page Config
     * @param {Function} callback will call with error and config
     */
    getConfig: function (callback) {
        var self  = this;

        if (self.config) {
            callback(null, self.config);
            return;
        }

        fu.readJSON(path.join(self.versionDir, Page.JSON_NAME), function (err, json) {
            if (err) {
                callback(err);
                return;
            }

            if (!json.plugins) {
                json.plugins = {};
            }


            self.app.getConfig(function(err, appCfg) {

                if (err) {
                    next(err);
                    return;
                }

                if (appCfg.plugins) {
                    _.defaults(json.plugins, appCfg.plugins);
                }

                self.config = json;
                callback(null, self.config);
            });


        });
    },
    /**
     * stop file watcher
     */
    stopWatch:function () {
        if (!self.watcher) {
            return;
        }
        self.watcher.stop();
    },
    /**
     * start file watcher on page version directory and utils of app
     */
    startWatch: function () {
        var self = this;

        if (self.watcher) {
            self.emit('watch_start', {
                watcher: self.watcher,
                dir: self.versionDir
            });
            return;
        }

        var wd = new WatchDir(self.pageDir);
        self.watcher = wd;

        wd.emit('watch_start', {
            watcher: self.watcher,
            dir: self.versionDir
        });

        wd.on('change', function (ev) {

            if (/-x?tpl\.js$/i.test(ev.path)) {
                return;
            }
            //去除毛燥 :)
            if (self.utilsWatchTimer) {
                clearTimeout(self.utilsWatchTimer)
            }

            self.utilsWatchTimer = setTimeout(function () {
                self.emit('change', {
                    path: ev.path
                });
            }, 50);
        });

        wd.on('error', function (error) {
            self.emit('watch_error', error);
            wd.stop();
            self.startWatch();
        });
    },
    /**
     * analyze page
     * @param callback with error and analyzing reports
     */
    analyze: function (callback) {
        var self = this;
        self.getConfig(function (err) {
            if (err) {
                return callback(err);
            }
            try {



                var pageDir = self.pageDir;

                fs.readdir(pageDir, function (err, files) {
                    if (err) {
                        return callback(err);
                    }

                    files = files.filter(function (file) {
                        var test = file.match(/(-min)?\.js$/i);
                        return  test && !test[1];
                    });
                    ModuleCompiler.clean();

                    ModuleCompiler.config({
                        packages:[{
                            name:'utils',
                            path:self.app.rootDir,
                            charset:self.app.getCharset()
                        }, {
                            name:Page.BASE_DIR_NAME,
                            path:self.versionDir,
                            charset:self.getInputCharset()
                        }
                        ],
                        silent: true
                    });

                    var results = files.map(function(file) {
                        file = path.join(pageDir, file);

                        var modules = ModuleCompiler.analyze(file);

                        var submods = _(modules.submods).chain()
                            .map(function(submod){
                                return {
                                    name: submod.name,
                                    status: submod.status,
                                    file: submod.path
                                };
                            })
                            .sortBy(function(submod){
                                return submod.name
                            })
                            .value();
                        return {
                            file: file,
                            name: modules.name,
                            status: modules.status,
                            mods: submods,
                            combined: modules.combined
                        }
                    });

                    var results = {
                        modules: results
                    };

                    callback(null, results);
                });


            } catch (e) {
                callback(e);
            }

        });

    },
    stopAutoBuild: function () {
        var self = this;
        self.stopWatch();
        self.app.stopWatchUtils(self);
        self.removeAllListeners('build_fail');
        self.removeAllListeners('build_success');
    },

    startAutoBuild: function (timestamp) {
        var self = this;
        var app = self.app;

        function buildPage(ev) {
            self.build(timestamp, function (err, reports) {
                if (err) {
                    self.emit('build_fail', err);
                    return;
                }
                reports.fileUpdate = ev.path;
                self.emit('build_success', reports);
            });
        }

        self.startWatch();
        app.startWatchUtils();

        app.on('utilsChange', buildPage);
        self.on('change', buildPage);

    },


    _initDirs: function (versionDir, callback) {
        async.forEachSeries (
            Page.DIRS,
            function (name, callback){
                var dir = path.join(versionDir, name);
                fs.exists(dir, function (exist) {
                    if (exist) {
                        return callback(null);
                    }
                    fs.mkdir(dir, callback)
                })
            },
            callback
        );
    },

    _initBuild: function (callback) {
        var self = this;
        self.getConfig(function(err, config){
            if (err) {
                return callback(err);
            }

            try {
                self._loadPlugins();
            } catch (e) {
                callback(e);
            }

            callback();
        });
    },



    _buildTarget: function (timestamp, callback) {
        var self = this;
        var startTime = new Date();
        var reports = {};

        if (!self.version) {
            return callback(new Error('Page#build: version is not setted; '));
        }

        if (!timestamp) {
            return callback(new Error('Page#build: timestamp missing'));
        }

        self.timestamp = timestamp;
        self.timestampDir = path.resolve(self.rootDir, timestamp.toString());

        async.series([
            function (callback){
                self._startBuild(callback);
            },

            function (callback){
                // 执行插件
                self._execPlugin(function (err, pluginReports) {
                    if (err) {
                        return callback(err);
                    }
                    reports.plugins = pluginReports;
                    callback(null);
                });
            },

            function (callback) {
                // 转码到发布目录
                fu.iconv({
                        from: {
                            path: self.destDir,
                            charset: 'utf8'
                        },

                        to: {
                            path: self.timestampDir,
                            charset: self.getOutputCharset()
                        }
                    },
                    callback
                );

            },

            function (callback) {
                async.forEach([self.srcDir, self.destDir], fu.rmTree, callback);
            },

            function (callback) {
                // 写入打包信息

                reports.fb = {
                    build_version: self.version,
                    build_start_time: startTime,
                    build_timestamp: timestamp,
                    build_used_time: new Date().getTime() - startTime.getTime()
                };

                fu.writeJSON(path.resolve(self.timestampDir, Page.BUILD_JSON_NAME), reports.fb, callback);
            }

        ], function (err) {
            if (err) {
                return callback(err);
            }

            callback(null, reports);
        });
    },

    /**
     * 排队打包系统
     * @param  {String}   timestamp timestamp of build target
     * @param  {Function} callback  optional will be call with error and reports
     */
    build: function (timestamp, callback) {
        var self = this;

        if (!callback) {
            return;
        }

        //检查时间戳
        if (!Page.testTimestamp(timestamp)) {
            var error = new Error();
            error.message = 'Timestamp invalid';
            error.name = 'BuildError';
            return callback(error);
        }

        self.buildQueue.push(timestamp, callback);

    },

    _execPlugin: function (callback) {
        var self = this;

        var page = {
            srcDir: self.srcDir,
            destDir: self.destDir,
            sourceBase: self.pageDir,
            rootDir: self.app.rootDir,
            utilsDir: self.app ? self.app.getUtilsDir() : null,
            config: _.clone(self.config),
            appCharset: self.app? self.app.getCharset() : null,
            charset: 'utf8',
            inputCharset: self.getInputCharset(),
            outputCharset: self.getOutputCharset()
        };

        var prev = new Date();

        async.mapSeries(self._plugins, function(plugin, callback) {
            plugin(page, function (err, report) {
                if (err) {
                    callback(err);
                    return;
                }
                if (report) {
                    var now = new Date();
                    report.used_time =  now - prev;
                    prev = now;
                }

                callback(null, report);
            });
        }, function (err, pluginReports) {

            if (err) {
                callback(err);
                return;
            }

            pluginReports = _.filter(pluginReports, function (reports) {
                return (typeof reports === 'object') && 'name' in reports;
            });

            callback(null, pluginReports);
        });

    },

    _loadPlugins: function () {
        var self = this;

        if (self._pluginLoaded) {
            return;
        }
        self._pluginLoaded = true;

        var pluginConfig = {
            base: Page.BASE_DIR_NAME
        };

        self.use(require('./plugins/kissy-template')(pluginConfig));
        self.use(require('./plugins/xtemplate')(pluginConfig));
        self.use(require('./plugins/template-back')(pluginConfig));
        self.use(require('./plugins/csslint')(pluginConfig));
        self.use(require('./plugins/module-compiler')(pluginConfig));
        self.use(require('./plugins/css-combo')(pluginConfig));
        self.use(require('./plugins/lesscss')(pluginConfig));
        self.use(require('./plugins/compass')(pluginConfig));
        self.use(require('./plugins/concat')(pluginConfig));
        self.use(require('./plugins/uglifyjs')(pluginConfig));
        self.use(require('./plugins/cssmin')(pluginConfig));
    },

    /**
     * 1. Make tempDirs after remove them
     * 2. iconv version dir to tempDir
     * 3. iconv build dir to tempDir
     * @param  {Function} callback [description]
     */
    _startBuild: function (callback) {
        var self = this;

        // make tempdir
        async.series([
            function (callback) {
                //make temp src and dest dirs
                async.forEach(
                    [self.srcDir, self.destDir],
                    function (dir, callback) {
                        fs.exists(dir, function (exist) {
                            if (exist) {
                                return fu.rmTree(dir, callback)
                            }
                            callback(null);
                        });
                    },
                    callback
                );
            },

            function (callback) {
                //make temp src and dest dirs
                async.forEach([
                    path.join(self.srcDir, Page.BASE_DIR_NAME),
                    path.join(self.destDir, Page.BASE_DIR_NAME),
                    path.join(self.srcDir, 'utils')
                ],
                    function (dir, callback) {
                        fu.mkdirp(dir, callback);
                    },
                    callback
                );
            },

            function (callback) {
                //copy and iconv from version to src dir
                fu.iconv({
                    from: {
                        path: self.pageDir,
                        charset: self.getInputCharset()
                    },
                    to: {
                        path: path.join( self.srcDir, Page.BASE_DIR_NAME),
                        charset: 'utf8'
                    }
                }, callback);
            },

            function (callback) {
                var app = self.app;

                if (!app) {
                    return callback(null);
                }


                fu.iconv({
                    from: {
                        path: app.getUtilsDir(),
                        charset: app.getCharset()
                    },

                    to: {
                        path: path.join(self.srcDir, 'utils'),
                        charset: 'utf8'
                    }
                }, callback);
            },

            function (callback) {
                // callback(new Error());
                //create timestamp dir
                fu.mkdirp(path.join(self.timestampDir, Page.BASE_DIR_NAME), callback);
            }
        ], callback);
    },

    getOutputCharset: function () {
        var self = this;
        return self.config.outputCharset || self.app.config.charset || 'utf8';
    },

    getInputCharset: function () {
        var self = this;
        return self.config.inputCharset || self.app.config.charset || 'utf8';
    },

    _makeTempDir: function (dirName, callback) {

        fs.exists(dirName, function (exist) {

            if (!exist) {
                return callback(null);
            }



            fu.rmTree(dirName, function (err) {
                if(err) {
                    return callback(err);
                }
                fs.mkdir(dirName, callback);
            });

        });
    },

    /**
     * add plugin to Page
     * @param  {Object} plugin the Page Plugins
     */
    use: function (plugin) {
        var self = this;

        if (typeof plugin !== 'function') {
            return;
        }
        if (!self._plugins) {
            self._plugins = [];
        }

        self._plugins.push(plugin);

    },

    /**
     * add a version to the page
     * @param {Function} callback callback with an error or null
     */
    initVersion: function (callback) {
        var self = this;
        var version = self.version;

        if (!self.rootDir) {
            return callback(new Error('不在Page文件夹内！'));
        }

        if (!version) {
            return callback(new Error("必须指定一个版本"));
        }

        if (!/^(\d+\.)+\d+$/.test(version)) {
            return callback(new Error('版本号格式错误。期望的格式是 x.x 或 x.x.x'));
        }

        var versionDir = self.versionDir = path.join(self.rootDir, version);

        var pageInfo = {
            name: self.name,
            version: version
        };

        var jsonFile = path.join(versionDir, Page.JSON_NAME);
        var logs = [];

        async.series([
            function (callback) {
                // mkdir pageRoot
                fs.exists(versionDir, function (exist) {
                    if (exist) {
                        logs.push('version directory exist');
                        return callback(null);
                    }
                    fu.mkdirp(versionDir, callback);
                });
            },

            function (callback) {
                //make directories
                self._initDirs(versionDir, callback);
            },

            function (callback) {
                //write config json
                fs.exists(jsonFile, function(exist) {

                    if (!exist) {
                        fu.writeJSON(jsonFile, {}, callback);
                        return;
                    }

                    fu.readJSON(jsonFile, function(err){
                        if (err) {
                            logs.push('fb.page.json 文件存在，不过JSON格式好像不正确，请更正后继续添加。');
                            return callback(new Error('JSON_Error;'))
                        }
                        callback(null);
                    });


                });
            },

            function (callback) {
                //write sh file
                var absPath = path.join(versionDir, Page.BUILD_SH);
                var template = _.template('#!/bin/sh\nki build <%= name%>/<%= version%> -t 000000');
                fs.exists(absPath, function (exist) {
                    if(exist) {
                        logs.push('%s exist, passed;', Page.BUILD_SH);
                        return callback(null);
                    }
                    fs.writeFile(absPath, template(pageInfo), function (err) {
                        if (err) {
                            return callback(err);
                        }
                        fs.chmod(absPath, '0777', callback);
                    });

                });
            },

            function (callback) {
                //write default Kissy mods
                var absPath = path.join(versionDir, Page.DEFAULT_JS);
                var default_kissy_mod = path.join(__dirname, '../files/default-kissy-mod.js');
                fs.exists(absPath, function (exist) {
                    if(exist) {
                        logs.push('%s exist, passed;', Page.DEFAULT_JS);
                        return callback(null);
                    }
                    var rs = fs.createReadStream(default_kissy_mod);
                    var ws = fs.createWriteStream(absPath);
                    rs.pipe(ws);
                    rs.on('end', callback);
                    rs.on('error', callback);
                });
            },

            function (callback) {
                //write bat file
                var absPath = path.join(versionDir, Page.BUILD_BAT);
                var template = _.template('ki build <%= name%>@<%= version%> -t 000000');

                fs.exists(absPath, function(exist){
                    if(exist) {
                        logs.push('%s exist, passed;', Page.BUILD_BAT);
                        return callback(null);
                    }
                    fs.writeFile(absPath, template(pageInfo), function (err) {
                        if (err) {
                            return callback(err);
                        }
                        fs.chmod(absPath, '0777', callback);
                    });

                });
            }

        ], function (err) {
            if (err) {
                err.logs = logs;
                callback(err);
            } else {
                callback(null, logs);
            }
        });
    }
});