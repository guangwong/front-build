var _ = require('underscore');
var iconv = require('iconv-lite');
var fs = require('fs');
var path = require('path');
var events = require("events");
var async = require('async');
var fu = require('./fileutils');


/**
 * Page Class
 * @param  {Object} cfg config
 *     cfg.fromDir {String} source code
 *     cfg.targetDir      {String} where builded source goto.
 *     cfg.inputCharset   {String} charset of source code
 *     cfg.outputCharset  {String} build charset. 
 */
var Page = module.exports = function(cfg) {
    var self = this;
    self.from_dir = path.resolve(cfg.fromDir);
    self.target_dir = path.resolve(cfg.targetDir);
    self.temp_source_dir = path.resolve(cfg.from_dir, '..', Page.TEMP_SOURCE_NAME);
    self.temp_build_dir = path.resolve(cfg.target_dir, '..', Page.TEMP_SOURCE_NAME);
    self.charset = 'utf8';
    self.input_charset = cfg.inputCharset || self.charset;
    self.output_charset = cfg.outputCharset || self.charset;
}

_.extend(Page, {
    TEMP_SOURCE_NAME: 'page_89988123123',
    TEMP_BUILD_DIR: 'page_89988123124',
    events: {
        START: 'buildStart',
        END: 'buildEnd'
    }
});

_.extend(Page.prototype, events.EventEmitter, {

    build: function(){
        var self = this;
        async.series([
            function(callback){
                self.startBuild(callback)
            },
            function(callback){
                self._build(callback);
            },
            function(callback){
                self.endBuild(callback)
            },
        ]);
    },

    _build: function(callback) {
        var self = this;
        async.forEachSeries(self._plugins, function(plugin, callback){
            plugin(self);
        }, callback);
    },

    startBuild: function(callback) {
        var self = this;
        // make tempdir
        self.makeTempDir(self.temp_source_dir);
        self.makeTempDir(self.temp_build_dir);
        // change charset to utf-8 and move move to tempdir
        fu.iconvDir(self.from_dir, self.input_charset, self.temp_source_dir, self.charset);
        // build
        self.emit('buildStart', self);
        process.nextTick(callback);
    },

    endBuild: function(callback) {
        // change charset to target charset and move to target
        fu.iconvDir(self.temp_build_dir, self.charset, self.target_dir, self.output_charset);
        // remove tempdir
        [self.temp_source_dir, self.temp_build_dir].forEach(function(dir) {
            fu.rmTreeSync(dir);
        };
        self.emit('buildSuccess', self);
        process.nextTick(callback);
    },

    makeTempDir: function(path) {

        if (path.exists(path)) {
            fu.rmTreeSync(path);
        }

        fs.makeDirSync(path);
    },
    /**
     * add plugin to Page
     * @param  {Object} plugin the Page Plugins
     * @return {[type]}        [description]
     */
    use: function(plugin) {
        var self = this;

        if (!typeof plugin !== 'function') {
            return;
        }

        self._plugins.push(plugin);
    }
});