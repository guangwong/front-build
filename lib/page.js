var _ = require('underscore');
var iconv = require('iconv-lite');
var fs = require('fs');
var path = require('path');
var async = require('async');
var fu = require('./fileutil');
var events = require('events');
var watchDir = require('./watchdir');

/**
 * Page Class
 * @param  {Object} cfg config
 *     cfg.name {String} name of page
 *     cfg.rootDir {String} source code
 *     cfg.version      {String} where builded source goto.
 *     cfg.inputCharset   {String} charset of source code
 *     cfg.outputCharset  {String} build charset. 
 */
var Page = module.exports = function(cfg) {
    var self = this;
    self.app = cfg.app || null;
    self.name = cfg.name;

    self.rootDir = path.resolve(cfg.rootDir);

    self.config = {
        inputCharset: 'utf8',
        outputCharset: 'utf8'
    };

    self._plugins = [];

    self.srcDir = path.resolve(self.rootDir, Page.TEMP_SOURCE_NAME);
    self.destDir = path.resolve(self.rootDir, Page.destDir);
    self.charset = 'utf8';

    self._build_targets = {};

}

_.extend(Page, {
    TEMP_SOURCE_NAME: 'page_src_temp',
    destDir: 'page_build_temp',
    JSON_NAME: 'fb.page.json',
    BUILD_SH: 'fb-build.sh',
    BUILD_BAT: 'fb-build.bat',
    BUILD_JSON_NAME: 'build.json',
    DIRS: ['page', 'test', 'page/mods'],
    DEFAULT_JS: 'page/init.js',
    DEFAULT_LESS: 'page/index.less',
    DEFAULT_CSS: 'page/index.css',

    parsePageVersion: function (page_version) {
        var pvReg = /^(\w[\w\-~]*)[@/\\](\d+(\.\d+)+)[/\\]?$/;
        var match = pvReg.exec(page_version);

        if (!match) {
            return null;
        }

        return {
            name: match[1],
            version: match[2]
        }

        return obj;
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

_.extend(Page.prototype, events.EventEmitter.prototype,　{

    addVersion: function (version, callback) {
        var self = this;
        if (!self.rootDir) {
            console.error('不在Page文件夹内！')
            return callback(new Error('Page#addVersion: no page'));
        }
        if (!version) {
            console.error("必须指定一个version: fb version {version}")
            process.exit(3);
        }

        if (!/^(\d+\.)+\d+$/.test(version)) {
            console.error("version 格式错误。期望的格式是 1.0")
            return callback(new Error('version not illegal'));
        }

        var versionDir = self.versionDir = path.resolve(self.rootDir, version);

        var pageInfo = {
            name: self.name, 
            version: version
        };
        
        var jsonfile = path.resolve(versionDir, Page.JSON_NAME);
        var logs = [];

        async.series([
            function (callback) {
                // mkdir pageRoot
                fs.exists(versionDir, function (exist) {
                    if (exist) {
                        logs.push('version directory exist');

                        return callback(null);
                    }
                    fs.mkdir(versionDir, callback);
                });
            },

            function (callback) {
                //mkdirs
                self._initDirs(versionDir, callback);
            },

            function (callback) {
                //write config json
                
                fs.exists(jsonfile, function(exist) {

                    if (!exist) {
                        fu.writeJSON(jsonfile, self.config, callback);
                        return;
                    }
                    
                    fu.readJSON(jsonfile, function(err, pagejson){
                        if (err) {
                            logs.push('fb.page.json 文件存在，不过JSON格式好像不正确，请更正后继续添加。');
                            return callback(new Error('JSON Format Error;'))
                        }
                        self.config = _.defaults(pagejson, self.confg);
                        fu.writeJSON(jsonfile, self.config, callback);
                    });
                    

                })
            },

            function (callback) {
                //write config json
                fu.writeJSON(jsonfile, self.config, callback);
            },


            function (callback) {
                //write sh file
                var filepath = path.resolve(versionDir, Page.BUILD_SH);
                var template = _.template('#!/bin/sh\nki build <%= name%>/<%= version%> -t 000000');
                fs.exists(filepath, function(exist){
                    if(exist) {
                        logs.push('%s exist, passed;', Page.BUILD_SH);
                        return callback(null);
                    }
                    fs.writeFile(filepath, template(pageInfo), function (err) {
                        if (err) {
                            return callback(err);
                        }
                        fs.chmod(filepath, '0777', callback);
                    });
                    
                });
            },

            function (callback) {
                //write default kissy mods
                var filepath = path.resolve(versionDir, Page.DEFAULT_JS);
                var default_kissy_mod = path.resolve(__dirname, '../files/default-kissy-mod.js')
                var template = _.template('#!/bin/sh\nki build <%= name%>/<%= version%> -t 000000');
                fs.exists(filepath, function(exist){
                    if(exist) {
                        logs.push('%s exist, passed;', Page.DEFAULT_JS);
                        return callback(null);
                    }
                    var rs = fs.createReadStream(default_kissy_mod);
                    var ws = fs.createWriteStream(filepath);
                    rs.pipe(ws);
                    rs.on('end', callback);
                    rs.on('error', callback);
                });
            },

            function (callback) {
                //write bat file
                var filepath = path.resolve(versionDir, Page.BUILD_BAT);
                var template = _.template('ki build <%= name%>@<%= version%> -t 000000')

                fs.exists(filepath, function(exist){
                    if(exist) {
                        logs.push('%s exist, passed;', Page.BUILD_BAT);
                        return callback(null);
                    }
                    fs.writeFile(filepath, template(pageInfo), function (err) {
                        if (err) {
                            return callback(err);
                        }
                        fs.chmod(filepath, '0777', callback);
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
    },

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
     * Page can build only after setVersion
     * @param  {Function} callback with callback(error)
     */
    setVersion: function (version, callback) {
        var self  = this;
        self.version = version;
        self.name_version = self.name + '@' + self.version;
        self.versionDir = path.resolve(self.rootDir, self.version);

        fs.exists(self.versionDir, function(exist){
            if (!exist) {
                return callback(new Error('Page %s/%s is not exist', self.name, version));
            }

            fu.readJSON(path.resolve(self.versionDir, Page.JSON_NAME), function (err, json) {
                if (err) {
                    return callback(err);
                }
                _.extend(self.config, json);
                self._loadPlugins(callback);
            });
        });
    },

    startWatch: function () {
        var self = this;
        var wd = watchDir(self.versionDir);

        wd.on('change', function () {
            self.emit('fileupdate');
        });
    },


    _initDirs: function(versionDir, callback) {
        async.forEachSeries (
            Page.DIRS,
            function (name, callback){
                var dir = path.resolve(versionDir, name);
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
                //准备工作
                self._startBuild(callback);
            },

            function (callback){
                self._execPlugin(function (err, pluginReports) {
                    if (err) {
                        return callback(err);
                    }
                    reports.plugins = pluginReports;
                    callback(null);
                });
            },

            function (callback) {
                //扫尾工作
                self._endBuild(callback);
            },

            function (callback) {

                reports.fb = {
                    build_version: self.version,
                    build_start_time: startTime,
                    build_timestamp: timestamp,
                    build_used_time: new Date().getTime() - startTime.getTime()
                }

                fu.writeJSON(path.resolve(self.timestampDir, Page.BUILD_JSON_NAME), reports.fb, callback);
            }

        ], function (err) {
            if (err) {
                return callback(err);
            }
            // console.log('build ended, %s has been builded to  %s', self.name_version, self.timestamp);

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

        //检查任务队列
        if (self._is_building) {
            if (!self._build_targets[timestamp]) {
                self._build_targets[timestamp] = [];
            }
            self._build_targets[timestamp].push(callback)
            return;
        }

        self._is_building = true;

        if (!self._build_targets[timestamp]) {
            self._build_targets[timestamp] = [];
        }

        self._build_targets[timestamp].push(callback)

        var callbacks = self._build_targets[timestamp];
        delete self._build_targets[timestamp];

        if (callbacks.length === 0 ){
            return;
        }

        self._buildTarget(timestamp, function (err, reports) {
            self._is_building = false;

            if (err) {
                callbacks.forEach(function (cb) {
                    cb(err);
                });
                return;
            }

            callbacks.forEach(function (cb) {
                cb(null, reports);
            });

            var timestamps = _.keys(self._build_targets);
            
            if (timestamps > 0) {
                self.build(timestamps.pop());
            }

        });
    },

    _execPlugin: function(callback) {
        var self = this;
        var page = {
            charset: self.charset,
            srcDir: self.srcDir,
            destDir: self.destDir,
            versionDir: self.versionDir,
            config: _.clone(self.config)
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

    _loadPlugins: function(callback) {
        var self = this;
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

        callback(null);
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
                        charset: self.config.inputCharset
                    },
                    to: {
                        path: path.join( self.srcDir, 'page'),
                        charset: self.charset
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
                        charset: app.config.charset
                    },

                    to: {
                        path: path.resolve(self.srcDir, 'utils'),
                        charset: self.charset
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

    _endBuild: function(callback) {
        var self = this;
        // change charset to target charset and move to target
        fu.iconvDir(self.destDir, self.charset, self.timestampDir, self.config.outputCharset);
        // remove tempdir
        async.forEach([self.srcDir, self.destDir], fu.rmTree, callback);
    },

    _makeTempDir: function(dir_name, callback) {

        fs.exists(dir_name, function (exist) {
                
            if (!exist) {
                return callback(null);
            }

            
            
            fu.rmTree(dir_name, function (err) {
                if(err) {
                    return callback(err);
                }
                fs.mkdir(dir_name, callback);
            });

        });
    },
    /**
     * add plugin to Page
     * @param  {Object} plugin the Page Plugins
     * @return {[type]}        [description]
     */
    use: function(plugin) {
        var self = this;

        if (typeof plugin !== 'function') {
            return;
        }
        if (!self._plugins) {
            self._plugins = [];
        }

        self._plugins.push(plugin);
        
    }
});