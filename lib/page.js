var _ = require('underscore');
var iconv = require('iconv-lite');
var fs = require('fs');
var util = require('util');
var path = require('path');
var async = require('async');
var fu = require('./fileutil');
var events = require('events');
var watchDir = require('./watchdir');
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
    self.pageDir = path.join(self.versionDir, 'page');
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
        if (!timestamp) return false;
        return /^\d\d\d\d\d\d(\d\d)?$/.test(timestamp);
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
            return callback(null, self.config);
        }

        fu.readJSON(path.join(self.versionDir, Page.JSON_NAME), function (err, json) {
            if (err) {
                return callback(err);
            }
            self.config = json;
            callback(null, self.config);
        });
    },


    startWatch: function () {
        var self = this;
        var wd = watchDir(self.versionDir);

        wd.on('change', function () {
            self.emit('fileupdate');
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
                                name:'page',
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
        self.getConfig(function(err){
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
            versionDir: self.versionDir,
            config: _.clone(self.config),
            charset: 'utf8'
        };

        var prev = new Date();
        
        async.mapSeries(self._plugins, function(plugin, callback) {
            plugin(page, function (err, report) {
                if (err) {
                    return callback(err);
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
                return callback(err);
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
            return callback();
        }
        self._pluginLoaded = true;

        var pluginConfig = {
            base: 'page'
        };

        self.use(require('./plugins/kissy-template')(pluginConfig));
        self.use(require('./plugins/csslint')(pluginConfig));
        self.use(require('./plugins/module-compiler')(pluginConfig));
        self.use(require('./plugins/css-combo')(pluginConfig));
        self.use(require('./plugins/lesscss')(pluginConfig));
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
                async.forEach(
                    [self.srcDir, self.destDir],
                    function (dir, callback) {
                        fu.mkdirp(path.resolve(dir, 'page'), callback);
                    },
                    callback
                );
            },

            function (callback) {
                //copy and conv charset from version to src dir
                fu.iconv({
                    from: {
                        path: path.join(self.versionDir, 'page'),
                        charset: self.getInputCharset()
                    },
                    to: {
                        path: path.join( self.srcDir, 'page'),
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
                        path: path.resolve(self.srcDir, 'utils'),
                        charset: 'utf8'
                    }
                }, callback);
            },

            function (callback) {
                // callback(new Error());
                //create timestamp dir
                fu.mkdirp(path.resolve(self.timestampDir, 'page'), callback);
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