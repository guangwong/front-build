var _ = require('underscore');
var iconv = require('iconv-lite');
var fs = require('fs');
var path = require('path');
var async = require('async');
var fu = require('./fileutil');

/**
 * Page Class
 * @param  {Object} cfg config
 *     cfg.rootDir {String} source code
 *     cfg.version      {String} where builded source goto.
 *     cfg.inputCharset   {String} charset of source code
 *     cfg.outputCharset  {String} build charset. 
 */
var Page = module.exports = function(cfg) {
    var self = this;
    self.app = cfg.app;

    self.rootDir = path.resolve(cfg.rootDir);

    self.config = {
        page_version: '0.3',
        inputCharset: 'utf8',
        outputCharset: 'utf8'
    };

    self._plugins = [];

    self.temp_src_dir = path.resolve(self.rootDir, Page.TEMP_SOURCE_NAME);
    self.temp_build_dir = path.resolve(self.rootDir, Page.TEMP_BUILD_DIR);
    self.charset = 'utf8';

}

_.extend(Page, {
    TEMP_SOURCE_NAME: 'page_src_temp',
    TEMP_BUILD_DIR: 'page_build_temp',
    JSON_NAME: 'fb.page.json',
    BUILD_JSON_NAME: 'build.json',
    DIRS: ['core', 'mods', 'test']
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
            
        async.series([
            function (callback) {
                fs.mkdir(versionDir, callback);
            },

            function (callback) {
                async.forEach(
                    Page.DIRS, 
                    function (name, callback){
                        fs.mkdir(path.resolve(versionDir, name), callback)
                    }, 
                    callback
                );
            },

            function (callback) { 
                fu.writeJSON(path.resolve(versionDir, Page.JSON_NAME), self.config, callback);
            },

            function (callback) {
                //write sh file
                var shContent = '#!/bin/sh\nfb build -t 000000';
                fs.writeFile(path.resolve(versionDir, 'fb-build.sh'), shContent, callback);
            },
            function (callback) {
                //write bat file
                var shContent = 'fb build -t 000000';
                fs.writeFile(path.resolve(versionDir, 'fb-build.bat'), shContent, callback);
            }

        ], callback);
    },

    /**
     * Page can build only after setVersion
     * @param  {Function} callback with (null)
     * @return {[type]}            [description]
     */
    setVersion: function (version, callback) {
        var self  = this;
        self.version = version;
        self.versionDir = path.resolve(self.rootDir, self.version);

        path.exists(self.versionDir, function(exist){
            if (!exist) {
                return callback('Page#setVersion: page dir or version dir is not exist')
            }

            fu.readJSON(path.resolve(self.versionDir, 'fb.page.json'), function (err, json) {
                if (!err && json) {
                    _.extend(self.config, json);
                }
                self.loadPlugins(callback);
                self.input_charset = self.config.inputCharset || self.charset;
                self.output_charset = self.config.outputCharset || self.charset;
            });
        });
    },

    loadPlugins: function(callback) {
        var self = this;

        self.use(require('./plugins/kissy-module-compiler')());
        self.use(require('./plugins/css-combo')());
        self.use(require('./plugins/lesscss')());
        self.use(require('./plugins/concat')());
        self.use(require('./plugins/uglifyjs')());

        callback(null);
    },

    build: function(timestamp, callback) {
        var self = this;
        if (!self.version) {
            return callback(new Error('Page#build: page version is not setted; '));
        }

        if (!timestamp) {
            return callback(new Error('Timestamp missing'))
        }
 
        self.timestampDir = path.resolve(self.rootDir, timestamp.toString());
        var startTime = new Date();

        async.series([
            function (callback){
                //准备工作
                self.startBuild(callback);
            },
            function (callback){
                self._build(callback);
            },
            function (callback) {
                //扫尾工作
                self.endBuild(startTime, callback);
            },

        ], callback);
    },

    _build: function(callback) {
        var self = this;
        async.forEachSeries(self._plugins, function(plugin, callback){
            plugin(self, callback);
        }, callback);
        
    },

    startBuild: function(callback) {
        console.log('build start');
        var self = this;
        // make tempdir
        async.forEach(
            [self.temp_src_dir, self.temp_build_dir], 
            self.makeTempDir,
            function(err){
                if (err) {
                    return callback(err);
                }
                fu.iconvDir(self.versionDir, self.input_charset, self.temp_src_dir, self.charset);
                path.exists(self.timestampDir, function (exist){
                    if (exist) {
                        return callback();
                    }
                    fs.mkdir(self.timestampDir, callback);
                });
            });
    },

    endBuild: function(startTime, callback) {
        console.log('build end');
        var self = this;
        // change charset to target charset and move to target
        fu.iconvDir(self.temp_build_dir, self.charset, self.timestampDir, self.output_charset);
        // remove tempdir
        [self.temp_src_dir, self.temp_build_dir].forEach(function(dir) {
            fu.rmTreeSync(dir);
        });

        fu.writeJSON(path.resolve(self.timestampDir, Page.BUILD_JSON_NAME), {
            build_version: self.version,
            build_time: new Date().toString(),
            build_used_time: new Date().getTime() - startTime.getTime()
        }, callback);
    },

    makeTempDir: function(dir_name, callback) {

        if (path.existsSync(dir_name)) {
            fu.rmTreeSync(dir_name);
        }

        fs.mkdir(dir_name, callback);
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

        self._plugins.push(plugin);
        
    }
});