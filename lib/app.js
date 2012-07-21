var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var fu = require('./fileutil');
var async = require('async');
var pkginfo = require('../package.json');

var Page = require('./page')
/**
 * FB 应用
 * @param  {Object} cfg the app info
 * @return {[type]}     [description]
 */
var App = module.exports = function(cfg) {
    var self = this;
    self.rootDir = cfg.rootDir;
    self.workDir = cfg.workDir || '';
    self._loadPlugins();
};

_.extend(App, {
    RootDirs: ['tools','docs','common', 'utils'],
    PageDirs: ['core', 'mods', 'test'],
    FB_JSON_NAME: 'fb.json',
    versionReg: /^\d+\.\d+$/,
    timestampReg: /^\d{6+}$/,
    version: pkginfo.version,
    defaultConfig: {
        //charset of common and utils
        charset: 'utf8',
        groups: {}
    },

    /**
     * 初始化项目根目录
     * @param  {String}   dir      target path
     * @param  {Object}   config   default app config
     * @param  {Function} callback callback with augment callback(error);
     * @return {[type]}            [description]
     */
    init: function(dir, callback) {
        dir = path.resolve(dir);
        var json_path = path.resolve(dir, App.FB_JSON_NAME);

        App.getApp(dir, function(err, app) {
            if (err) {
                return callback(err);
            }
            if (app) {
                return callback(new Error('Already initd as a FB project'));
            }

            var app =  new App({
                rootDir: dir
            });

            async.series([
                function (callback) {
                    app._initDirs(callback);
                },

                function (callback) {
                    //create fb.json
                    console.log('file "%s" created.', App.FB_JSON_NAME);
                    app.saveConfig(callback);
                    
                },

                function (callback) {
                    //copy package-config.js to common
                    app._copyFile(callback);
                }

            ], callback);

            
        });
        
    },



    /**
     * find the app rootDir by the fb.json file
     * from dir to up
     * @param  {String}   dir      current path
     * @param  {Function} callback callback with argument callback(error, app)
     */
    getApp: function(dir, callback) {

        function getRootSync(cPath) {
            var currentPath,
                nextPath = cPath,
                stat;

            do {
                currentPath = nextPath;
                try {
                    stat = fs.statSync(path.resolve(currentPath, App.FB_JSON_NAME));;

                    if (stat && stat.isFile) {
                        return currentPath;
                    }
                } catch (e) {

                }
                nextPath = path.join(currentPath, '..');
            } while (currentPath !== nextPath);

            return null;
        }

        var workDir = path.resolve(dir),
            page = null,
            rootdir = getRootSync(workDir);

        if(!rootdir) {
            return callback(null);
        }

        fu.readJSON(path.resolve(rootdir, App.FB_JSON_NAME), function(err, json){
            if (err) {
                console.log('%s 文件JSON格式错误或文件不存在。', App.FB_JSON_NAME);
                return callback(err);
            }

            var app = new App({
                rootDir: rootdir,
                workDir: path.relative(rootdir, workDir)
            });

            app.getConfig(function(err, json) {
                if (err) {
                    return callback(err);
                }

                callback(null, app);
            });
        });
    }

});

_.extend(App.prototype, {
    _initDirs: function(callback){
        //create directories
        var self = this;
        async.forEach(App.RootDirs, function (p, callback) {
            var tPath = path.resolve(self.rootDir, p);

            fs.exists(tPath, function (exist) {
                if (exist) {
                    console.log('directory exist: %s', p);
                    return callback(null);
                }
                console.log('directory created: %s', p);
                fs.mkdir(tPath, callback);
            });
        }, callback);
        
    },
    /**
     * Get all pages of app
     * @param  {Function} callback called with array of pages
     */
    getPages: function (callback) {
        var self = this;
        fu.findInDir(self.rootDir, function (err, files) {
            if (err) {
                return callback(err);
            }
            var files = files.filter(function (file) {
                return /fb\.page\.json$/.test(file);
            });

            async.filter(files, function (file, callback) {
                console.log('fileter', file);
                var dir = path.dirname(file);
                var full = path.resolve(self.rootDir, file);
                var dirValid = !!Page.parsePageVersion(dir);
                callback(dirValid);
            }, function (files) {
                console.log('getPages', files)
                async.map(files, function (file, callback) {
                    var dir = path.dirname(file);
                    var pageVersion = Page.parsePageVersion(dir);
                    var json_path = path.resolve(self.rootDir, file);
                    var version_path = path.resolve(self.rootDir, dir);
                    var obj = {
                        pageName: pageVersion.pageName,
                        version: pageVersion.version
                    }
                    callback(null, obj);
                }, callback);
            });
        });
   
    },


    /**
     * update exist FB app
     * @param  {Function} callback callback with callback(err);
     */
    update: function(callback) {
        var self = this;

        async.series([
            function (callback) {
                self._initDirs(callback);
            },

            function (callback){
                self.getConfig(callback);
            },


            function (callback) {
                if (!self.config.fbversion || self.config.fbversion < App.version) {
                    self.config.fbversion = App.version;
                    self.config = _.extend(App.defaultConfig, self.config);
                    self.saveConfig(callback);
                } else {
                    callback(null);
                }
            },

            function (callback){
                self._copyFile(callback);
            }

        ], callback);

    },

    /**
     * Add page to app
     * @param {String} pageVersion pagename and version pair, ex: pagename@1.0
     * @param {Function} callback will be called with (error, page);
     */
    addPage: function(pageVersion, callback) {
        var self = this;
        //黑名单
        var parsed = Page.parsePageVersion(pageVersion);

        if (!parsed) {
            return callback(new Error('pagename 格式不正确'));
        }

        var pageName = parsed.pageName;

        var blacklist = _.extend([], App.RootDirs, App.PageDirs);

        if (blacklist.indexOf(pageName) != -1 ) {
            callback(new Error('App#addPage: name error'));
            return;
        }



        function onExist (err) {
            if(err) {
                return callback(err);
            }
            var page = self.getPage(pageName);
            page.addVersion(parsed.version, callback);

        }

        var target = path.resolve(self.rootDir, pageName);
        fs.exists(target, function (exist){
            if (!exist) {
                return fs.mkdir(target, onExist);
            }
            onExist(null);
        });

    },

    /**
     * 通过pagename 返回一个page
     * @return {Page} the target Page
     */
    getPage: function(pageName){
        var self = this;
        var page = null;
        pageName = pageName || self.getCurrent().pageName;

        if (pageName) {
            page = new Page({
                name: pageName,
                app: self,
                rootDir: path.resolve(self.rootDir, pageName)
            });
        }

        return page;
    },

    /**
     * get the current page and version based on cwd
     * 如： 工作目录为 root/x/y/z 则 pageName 为 x, version 为 y
     * @return {Page} the target Page
     */
    getCurrent: function () {
        var self = this;
        var rel = self.workDir;
        var dirs;
        var current = {};
        if (rel) {
            dirs = rel.replace('\\','/').split('/');

            current.pageName = dirs[0];

            if (dirs.length >= 2) {
                current.version = dirs[1];
            }
        }
        return current;
    },
    /**
     * Get the Common directory of App
     * @return {String} path of common directory
     */
    getCommonDir: function(){
        var self = this;
        return path.resolve(self.rootDir, 'common');
    },
    /**
     * Get the Util directory of App
     * @return {String} absolute path
     */
    getUtilsDir: function() {
        var self = this;
        return path.resolve(self.rootDir, 'utils');
    },

    /**
     * build the common
     * @param {Function} callback called with (err)
     */
    buildCommon: function (callback){
        var self = this;
        var commonDir = self.getCommonDir();
        var src_temp_dir = path.resolve(self.rootDir, 'common_temp_src')
        var build_temp_dir = path.resolve(self.rootDir, 'common_temp_build');
        self.getConfig(function(err, config) {
            if(err) {
                return callback(err);
            }
            var commonPage = {
                srcDir: src_temp_dir,
                destDir: build_temp_dir,
                inputCharset: config.charset,
                outputCharset: config.charset,
                config: config.common || {}
            };

            self._buildCommon(commonPage, callback);

        });
    },

    _copyFile: function(callback) {
        var self = this;
        var commonDir = path.resolve(self.rootDir, 'common');
        var src = path.resolve(__dirname, '../files/package-config.js');
        var dest = path.resolve(commonDir, 'package-config.js');

        fs.exists(dest, function (exist){

            if (exist) {
                console.log('package-config.js is already exist;');
                return callback(null);
            }

            var ws = fs.createWriteStream(dest, {start: 0});
            var rs = fs.createReadStream(src);
            rs.on('end', callback);
            rs.on('error', callback);
            rs.pipe(ws);
        });
    },

    _buildCommon: function(commonPage, callback){
        var self = this;
        var commonDir = self.getCommonDir();
        async.series([
            //准备临时目录
            function (callback){
                // console.log('buildCommon: %s', 'prepare');
                async.forEach([commonPage.srcDir, commonPage.destDir], function (absdir, callback){
                    fs.exists(absdir, function(exist) {
                        if (!exist) {
                        }
                            fs.mkdir(absdir, callback);

                        fu.rmTree(absdir, function(err) {
                            if (err) {
                                return callback(err);
                            }

                            fs.mkdir(absdir, callback);
                        });
                    });
                }, callback);
            },

            //编码转换
            function (callback) {
                // console.log('buildCommon: %s', 'ICONV');
                fu.iconv({
                    from: {
                        path: commonDir,
                        charset: self.config.charset,
                        excludes: [ /-min\.\w+$/ ]
                    },
                    to: {
                        path: commonPage.srcDir,
                        charset: 'utf8'
                    }
                }, callback);
            },

            //执行插件
            function (callback) {
                // console.log('buildCommon: %s', 'plugins');
                async.forEachSeries(self._plugins, function(plugin, callback) {
                    plugin(commonPage, callback);
                }, callback);
            },

            function (callback) {
                // console.log('buildCommon: %s', 'iconv');
                //编码转换
                fu.iconv({
                    from: {
                        path: commonPage.destDir,
                        charset: 'utf8',
                        test: /-min\.\w+$/i
                    },
                    to: {
                        path: commonDir,
                        charset: commonPage.outputCharset
                    }
                }, callback);
            },
            function (callback) {
                // console.log('buildCommon: %s', 'rmTemp');
                async.forEach([commonPage.srcDir, commonPage.destDir], function (p, callback) {
                    fu.rmTree(p, callback);
                }, callback);
            }

        ], callback);
    },

    _loadPlugins: function() {
        var self = this;

        var pluginConfig = {
            base: './'
        };

        self.use(require('./plugins/common-module-compiler')(pluginConfig));
        self.use(require('./plugins/css-combo')(pluginConfig));
        self.use(require('./plugins/lesscss')(pluginConfig));
        self.use(require('./plugins/uglifyjs')(pluginConfig));
        self.use(require('./plugins/cssmin')(pluginConfig));
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
        
    },

    /**
     * Get the config of app from file or cache
     * @param  {Function} callback call back with config
     */
    getConfig: function (callback) {
        var self = this;
        if (self.config) {
            return callback(null, self.config);
        }

        fu.readJSON(path.resolve(self.rootDir, App.FB_JSON_NAME), function (err, json) {
            if (err) {
                return callback(err);
            }
            self.config = json;
            callback(null, json);
        });
    },

    /**
     * save config to file
     * @param  {Function} callback with(err);
     */
    saveConfig: function (callback) {
        var self = this;

        if (!self.config) {
            self.config = _.defaults({
                    fbversion: App.version
                }, App.defaultConfig);
        }

        var json_path = path.resolve(self.rootDir, App.FB_JSON_NAME);

        fu.writeJSON(json_path, self.config, callback);
    },

    /**
     * check the groupname
     * @param  {String} groupName name of group
     * @return {Boolean}          return true if name valid
     */
    testGroupName: function(groupName) {
        return /^[_a-z0-9][-_a-z0-9]*$/i.test(groupName);
    },

    /**
     * set a group
     * @param {String}   groupName name of group
     * @param {Array}   pages     array of pageNames(name@version)
     * @param {Function} callback  callback with err;
     */
    setGroup: function (groupName, pages, callback) {

        var self = this;

        if (!self.testGroupName(groupName)) {
            return callback('GroupName not valid;');
        }

        for(var i = 0; i < pages.length; i++) {
            if (!Page.parsePageVersion(pages[i])) {
                return callback('Page' + pages[i] + 'is not valid;');
            }
        }

        self.getConfig(function (err, config) {
            if (err) {
                return callback(err);
            }

            if (!config.groups) {
                config.groups = {};
            }

            config.groups[groupName] = pages;
            self.saveConfig(callback);
            
        });

    },

    /**
     * Get group by name
     * @param  {String}   groupName name of group
     * @param  {Function} callback  with(err, pages);
     */
    getGroup: function(groupName, callback) {
        var self = this;

        if (!self.testGroupName(groupName)) {
            return callback('GroupName not valid;');
        }

        self.getGroups(function(err, groups) {
            if (err) {
                return callback(err);
            }
            if (!groups) {
                return callback(new Error('no group'))
            }
            if (!groups[groupName]) {
                return callback(new Error('no group'))
            }
            return callback(null, groups[groupName]);
        });
    },

    /**
     * Remove a group from App
     * @param  {String}   groupName name of group
     * @param  {Function} callback  call with an error or null
     */
    rmGroup: function (groupName, callback) {
        var self = this;

        if (!self.testGroupName(groupName)) {
            return callback(new Error('groupName not valid'));
        }

        self.getConfig(function(err, config) {

            if (err) {
                return callback(err);
            }

            if (!config.groups || !config.groups[groupName]) {
                return callback(new Error('group not exist'));
            }

            delete config.groups[groupName];

            self.saveConfig(callback);
        });
    },

    /**
     * Build pages from a group by name
     * @param  {String} groupName name of group
     * @param  {String} timestamp building to
     * @param {Function} callback call with error or null when done;
     */
    buildGroup: function (groupName, timestamp, callback) {

        self.getGroups(function (err, groups) {
            if (err) {
                return callback(err);
            }

            async.forEach(groups, function (page, callback) {
                var parsed = Page.parsePageVersion(page);

                if (!parsed.pageName || !parsed.version) {
                    console.log('Page "%s" is not valid', page);
                    callback(null);
                }

                var page = app.getPage(parsed.pageName);

                page.setVersion(parsed.version, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    page.build(timestamp, callback);
                });

            }, callback);

        });
    },

    /**
     * get all groups
     * @param  {Function} callback with (err, groups);
     */
    getGroups: function(callback) {
        var self = this;

        self.getConfig(function(err, config) {
            if (err) {
                return callback(err);
            }

            return callback(null, config.groups || {});
        });
    }
});