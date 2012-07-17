var _ = require('underscore');
var iconv = require('iconv-lite');
var fs = require('fs');
var path = require('path');
var async = require('async');
var fu = require('./fileutil');

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
    DIRS: ['core', 'mods', 'test'],
    parsePageVersion: function (page_version) {
        var pvReg = /^(\w[\w\-~]*)[@/\\](\d+(\.\d+)+)[/\\]?$/;
        var match = pvReg.exec(page_version);

        if (!match) {
            return null;
        }

        return {
            pageName: match[1],
            version: match[2]
        }

        return obj;
    }
});

_.extend(Page.prototype, {

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

        async.series([
            function (callback) {
                // mkdir pageRoot
                fs.exists(versionDir, function (exist) {
                    if (exist) {
                        console.log('version directory exist');
                        return callback(null);
                    }
                    fs.mkdir(versionDir, callback);
                });
            },

            function (callback) {
                //mkdir s
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
                            console.log('fb.page.json 文件存在，不过JSON格式好像不正确，请更正后继续添加。');
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
                var template = _.template('#!/bin/sh\nfb build <%= name%>/<%= version%> -t 000000');
                fs.exists(filepath, function(exist){
                    if(exist) {
                        console.log('%s exist, passed;', Page.BUILD_SH);
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
                //write bat file
                var filepath = path.resolve(versionDir, Page.BUILD_BAT);
                var template = _.template('fb build <%= name%>@<%= version%> -t 000000')

                fs.exists(filepath, function(exist){
                    if(exist) {
                        console.log('%s exist, passed;', Page.BUILD_BAT);
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

        ], callback);
    },

    /**
     * get all timestamps of current page
     * @param  {Function} callback call back with  array timestamps
     */
    getTimestamps: function (callback) {
        var self = this;
        var rootDir = self.rootDir;
        fs.readdir(rootDir, function (err, files) {
            if (err) {
                return callback(err);
            }
            async.filter(files, function (filename, callback) {

                fs.stat(path.resolve(rootDir, filename), function (err, stat) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(stat.isDirectory() && /^\d{8}$/.test(filename));

                });
            }, callback);
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
                return callback(new Error('Page#setVersion: ' + self.name + '@' + version +' is not exist'));
            }

            fu.readJSON(path.resolve(self.versionDir, Page.JSON_NAME), function (err, json) {
                if (err) {
                    return callback(err);
                }
                _.extend(self.config, json);

                self.input_charset = self.config.inputCharset || self.charset;
                self.output_charset = self.config.outputCharset || self.charset;

                self._loadPlugins(callback);
            });
        });
    },


    _initDirs: function(versionDir, callback) {
        async.forEach(
            Page.DIRS, 
            function (name, callback){
                var dir = path.resolve(versionDir, name);
                fs.exists(dir, function (exist) {
                    if (exist) {
                        console.log('%s exists; passed', name);
                        return callback(null);
                    }
                    fs.mkdir(dir, callback)
                })
            }, 
            callback
        );
    },

    _loadPlugins: function(callback) {
        var self = this;

        self.use(require('./plugins/csslint')({
            base: 'core'
        }));

        self.use(require('./plugins/module-compiler')({
            base: 'core'
        }));

        self.use(require('./plugins/css-combo')({
            base: 'core'
        }));

        self.use(require('./plugins/lesscss')({
            base: 'core'
        }));

        self.use(require('./plugins/concat')());
        
        self.use(require('./plugins/uglifyjs')({
            base: 'core'
        }));
        self.use(require('./plugins/cssmin')({
            base: 'core'
        }));

        callback(null);
    },


    _buildTarget: function (timestamp, callback) {
        var self = this;
        if (!self.version) {
            return callback(new Error('Page#build: version is not setted; '));
        }

        if (!timestamp) {
            return callback(new Error('Page#build: timestamp missing'));
        }

        self.timestamp = timestamp;
        self.timestampDir = path.resolve(self.rootDir, timestamp.toString());
        var startTime = new Date();

        async.series([
            function (callback){
                //准备工作
                self._startBuild(callback);
            },
            function (callback){
                self._build(callback);
            },
            function (callback) {
                //扫尾工作
                self._endBuild(startTime, callback);
            },

        ], callback);
    },

    /**
     * 排队打包系统
     * @param  {String}   timestamp timestamp of build target
     * @param  {Function} callback  optional will call with error or null
     */
    build: function (timestamp, callback) {
        var self = this;

        if (self._is_building) {
            if (!self._build_targets[timestamp]) {
                self._build_targets[timestamp] = [];
            }

            if (callback) {
                self._build_targets[timestamp].push(callback)
            }
            return;
        }

        self._is_building = true;

        if (!self._build_targets[timestamp]) {
            self._build_targets[timestamp] = [];
        }

        if (callback) {
            self._build_targets[timestamp].push(callback)
        }

        var callbacks = self._build_targets[timestamp];
        delete self._build_targets[timestamp];

        if (callbacks.length === 0 ){
            return;
        }

        self._buildTarget(timestamp, function (err) {
            self._is_building = false;
            if (err) {
                callbacks.forEach(function (cb) {
                    cb(err);
                });
                return;
            }

            callbacks.forEach(function (cb) {
                cb(null);
            });

            var timestamps = _.keys(self._build_targets);
            
            if (timestamps > 0) {
                self.build(timestamps.pop());
            }

        });
    },

    _build: function(callback) {
        var self = this;
        
        async.forEachSeries(self._plugins, function(plugin, callback) {
            plugin(self, callback);
        }, callback);
        
    },

    _startBuild: function(callback) {
        var self = this;

        console.log('building %s to %s', self.name_version, self.timestamp);

        // make tempdir
        async.series([
            function (callback) {
                //make temp src and dest dirs
                async.forEach(
                    [self.srcDir, self.destDir],
                    self._makeTempDir,
                    callback
                );
            },

            function (callback) {
                //copy and conv charset from version to src dir
                fu.iconv({
                    from: {
                        path: self.versionDir,
                        charset: self.input_charset
                    },
                    to: {
                        path: self.srcDir,
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
                //create timestamp dir
                var timestampDirs = [self.timestampDir, path.resolve(self.timestampDir, 'core')];

                async.forEachSeries(timestampDirs, function (p, callback){
                    fs.exists(p, function (exist){
                        if (exist) {
                            return callback();
                        }

                        fs.mkdir(p, callback);
                    });

                }, callback);
            },
        ], callback);
    },

    _endBuild: function(startTime, callback) {
        console.log('build end');
        var self = this;
        // change charset to target charset and move to target
        fu.iconvDir(self.destDir, self.charset, self.timestampDir, self.output_charset);
        // remove tempdir
        async.forEach([self.srcDir, self.destDir], function(dir, callback) {
            fu.rmTree(dir, callback);
        }, function (err) {
            if (err) {
                return callback(err);
            }
            fu.writeJSON(path.resolve(self.timestampDir, Page.BUILD_JSON_NAME), {
                build_version: self.version,
                build_time: new Date().toString(),
                build_used_time: new Date().getTime() - startTime.getTime()
            }, callback);
            
        });
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