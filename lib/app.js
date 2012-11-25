var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var fu = require('./fileutil');
var async = require('async');
var pkginfo = require('../package.json');
var events = require('events');
var WatchDir = require('./watchdir');

var Page = require('./page');

module.exports = App;

/**
 * 应用
 * @param  {Object} cfg the app info
 * @constructor
 */
function App (cfg) {
    var self = this;
    self.rootDir = cfg.rootDir;
    self.name = path.basename(self.rootDir);
    self.workDir = cfg.workDir || '';
    self._loadPlugins();

    self.commonBuildQueue = async.queue(function(task, callback) {
        self._initBuildCommon(function(err) {
            if (err) {
                return callback(err);
            }
            self._buildCommon(task, callback);
        });
    }, 1);
}



_.extend(App, /** @lends App **/{
    RootDirs: ['tools','docs','common', 'utils'],
    PageDirs: ['core', 'mods', 'test'],
    FB_JSON_NAME: 'fb.json',
    versionReg: /^\d+\.\d+$/,
    timestampReg: /^\d{6+}$/,
    version: pkginfo.version,
    defaultConfig: {
        charset: 'utf8',
        fbversion: pkginfo.version,
        packages: {},
        groups: {}
    },

    defaultGlobalConfig: {
        packages: {}
    },

    /**
     * 初始化项目根目录
     * @param  {String}   dir      target path
     * @param  {Function} callback callback with augment callback(error, reporter);
     */
    init: function(dir, callback) {
        dir = path.join(dir);

        App.getApp(dir, function(err, app) {
            if (err) {
                return callback(err);
            }
            if (app) {
                return callback(new Error('Already inited as a FB project'));
            }

            app =  new App({
                rootDir: dir
            });

            var reporters = {};
            async.series([
                function (callback) {
                    app._initDirs(function (err, reporter) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        reporters.dirs = reporter;
                        callback(null);
                    });
                },

                function (callback) {
                    //create fb.json
                    app.saveConfig(callback);

                },

                function (callback) {
                    //copy package-config.js to common
                    app._copyFiles(function(err, reporter) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        reporters.files = reporter;
                        callback(null);
                    });
                }],

                function (err) {

                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, reporters);
                });

            
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
                    stat = fs.statSync(path.join(currentPath, App.FB_JSON_NAME));;

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
            rootDir = getRootSync(workDir);

        if(!rootDir) {
            callback(null);
            return;
        }

        fu.readJSON(path.join(rootDir, App.FB_JSON_NAME), function(err, json){
            if (err) {
//                console.log('%s 文件 "fb.json" 格式错误或文件不存在。', App.FB_JSON_NAME);
                callback(err);
                return;
            }

            var app = new App({
                rootDir: rootDir,
                workDir: path.relative(rootDir, workDir)
            });

            app.getConfig(function(err, json) {
                if (err) {
                    callback(err);
                    return;
                }

                callback(null, app);
            });
        });
    },


    getGlobalConfig: function (callback) {
        // var jsonFileName = (require('os').platform() === 'win32') ? 'fb.global.json': '.fb.global.json';
        var jsonFileName = '.fb.global.json';
        var jsonPath = path.join(fu.getUserHome(), jsonFileName);
        fu.readJSON(jsonPath, function (err, jsondata) {

            if (err) {
                return callback(App.defaultGlobalConfig);
            }

            var cfg = _.defaults(jsondata, App.defaultGlobalConfig);
            return callback(cfg);
        });
    }

});

_.extend(App.prototype, events.EventEmitter.prototype, /** @lends App.prototype */{

    _initDirs: function(callback){
        //create directories
        var self = this;
        async.map(App.RootDirs, function (p, callback) {
            var tPath = path.join(self.rootDir, p);

            var file = {
                filename: p,
                status: ''
            };

            fs.exists(tPath, function (exist) {

                if (exist) {
                    file.status = 'exist';
                    callback(null, file);
                    return;
                }

                fs.mkdir(tPath, function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    file.status = 'ok';
                    callback(null, file);
                });
            });
        }, callback);
        
    },

    /**
     * Get all pages of app
     * @param  {Function} callback called with an error object and pages array
     */
    getPages: function (callback) {
        var self = this;
        fu.findInDir(self.rootDir, function (err, files) {
            if (err) {
                return callback(err);
            }

            var files = files.filter(function (file) {
                return path.basename(file) === 'fb.page.json';
            });

            async.map(files, function (file, callback) {
                var dir = path.dirname(file);
                var parsed = Page.parsePageVersion(dir);
                callback(null, parsed);
            }, function (err, pageVersions) {
                if (err) {
                    return callback(err);
                }
                var result = pageVersions.filter(function(pv){
                    return pv;
                });

                callback(null, result);
            });
        });
   
    },

    /**
     * get charset of current app
     * @return {*|String}
     */
    getCharset: function () {
        var self = this;
        return self.config.charset || 'utf8';
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
                self._copyFiles(callback);
            }

        ], callback);

    },

    /**
     * add page to app
     * @param {String} pageVersion
     * @param {Function} callback
     */
    addPage: function(pageVersion, callback) {
        var self = this;
        //黑名单
        var parsed = Page.parsePageVersion(pageVersion);

        if (!parsed) {
            return callback(new Error('pagename 格式不正确'));
        }

        var pageName = parsed.name;

        var blacklist = _.extend([], App.RootDirs, App.PageDirs);

        if (blacklist.indexOf(pageName) != -1 ) {
            callback(new Error('App#addPage: name error'));
            return;
        }

        function onExist (err) {
            if(err) {
                return callback(err);
            }
            var page = self.getPage(pageName, parsed.version);

            page.initVersion(callback);

        }

        var target = path.join(self.rootDir, pageName);

        fs.exists(target, function (exist) {
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
    getPage: function(pageName, version){
        var self = this;
        var page = null;

        pageName = pageName || self.getCurrent().pageName;

        if (pageName && version) {
            page = new Page({
                name: pageName,
                app: self,
                version: version,
                rootDir: path.join(self.rootDir, pageName)
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
            dirs = rel.split(path.sep);

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
        return path.join(self.rootDir, 'common');
    },
    /**
     * Get the Util directory of App
     * @return {String} absolute path
     */
    getUtilsDir: function () {
        var self = this;
        return path.join(self.rootDir, 'utils');
    },

    startWatchUtils: function () {
        var self = this;
        if (self.utilsWatchr) {
            return;
        }
        var wd = new WatchDir(self.getUtilsDir());
        self.utilsWatchr = wd;

        wd.on('change', function (ev) {

            if (/-x?tpl\.js$/i.test(ev.path)) {
                return;
            }

            //去除毛燥 :)
            if (self.utilsWatchTimer) {
                clearTimeout(self.utilsWatchTimer)
            }

            self.utilsWatchTimer = setTimeout(function () {
                self.emit('utilsChange');
            }, 50);

        });

        self.utilsWatchr.on('error', function (error) {
            self.emit('watch_error', error);
            wd.stop();
            self.startWatchUtils();
        });
    },

    startWatchCommon: function () {
        var self = this;

        if (self.commonWatcher) {
            return;
        }

        var wd = new WatchDir(self.getCommonDir());
        self.commonWatcher = wd;

        wd.on('change', function (ev) {

            if (/-x?tpl\.js$/i.test(ev.path)) {
                return;
            }
            if (/-min\.(js|css)$/i.test(ev.path)) {
                return;
            }

            //去除毛燥
            if (self.commonWatchTimer) {
                clearTimeout(self.commonWatchTimer)
            }

            self.commonWatchTimer = setTimeout(function () {
                self.emit('commonChange');
            }, 50);

        });

        wd.on('error', function (error) {
            self.emit('watch_error', error);
            wd.stop();
            self.startWatchUtils();
        });
    },

    stopAutoBuildCommon: function (){
        var self = this;
        if (self.commonWatcher) {
            self.commonWatcher.stop();
        }
    },

    autoBuildCommon: function () {
        var self = this;

//        console.log('start auto build');
        self.startWatchCommon();
        self.on('commonChange', function (err) {
           self.buildCommon(function (err, reporter) {
               if (err) {
                   self.emit('common_build_error', err);
                   return;
               }

               self.emit('common_build_success', reporter);
           });
        });
    },

    /**
     * stop utils file watcher
     */
    stopWatchUtils: function () {
        var self = this;
        self.removeAllListeners('utilsChange');
        if (self.utilsWatchr) {
            self.utilsWatchr.stop();
            self.utilsWatchr = null;
        }
    },

    /**
     * build the common
     * @param {Function} callback called with (err)
     */
    buildCommon: function (callback) {
        var self = this;
        self.commonBuildQueue.push({
            callTime: new Date().getTime()
        }, callback);
    },

    _initBuildCommon: function (callback) {
        var self = this;
        self.getConfig(callback);
    },

    /**
     * build pages
     */
    buildPages: function(pages, timestamp, callback) {
        var self = this;
        self.getConfig(function (err) {

            if (err) {
                return callback(err);
            }

            async.map(pages, function (target, callback) {
                var parsed = Page.parsePageVersion(target);
                var page = self.getPage(parsed.name, parsed.version);
                page.build(timestamp, callback);
            }, callback);

        });

    },

    /**
     * copy default files to app
     * @param callback {Function}
     * @private
     */
    _copyFiles: function(callback) {
        var self = this;
        var fbRoot = path.join(__dirname, '..');

        var jobs = [
            {   
                filename: 'common/package-config.js',
                src: path.join(fbRoot, 'files/package-config.js')
            },
            {
                filename: 'tools/web-client.sh',
                src: path.join(fbRoot, 'files/web-client.sh')
            },
            {
                filename: 'tools/web-client.bat',
                src: path.join(fbRoot, 'files/web-client.bat')
            },
            {
                filename: 'tools/app-update.bat',
                src: path.join(fbRoot, 'files/app-update.bat')
            },
            {
                filename: 'tools/app-update.sh',
                src: path.join(fbRoot, 'files/app-update.sh')
            }
        ];

        async.map(jobs, function (job, callback) {
            var dest = path.join(self.rootDir, job.filename);

            fs.exists(dest, function (exist) {

                if (exist) {
                    job.status = 'exist';
                    callback(null, job);
                    return;
                }


                var ws = fs.createWriteStream(dest, {start: 0});
                var rs = fs.createReadStream(job.src);

                rs.on('end', function (err) {
                    job.status = 'added';
                    callback(null, job);
                });

                rs.on('error', function (err) {
                    callback(err);
                });

                rs.pipe(ws);
            });
        }, callback);

    },

    _buildCommon: function(task, callback) {
        var self = this;

        var config = self.config;

        var commonDir = self.getCommonDir();
        var src_temp_dir = path.join(self.rootDir, 'common_temp_src');
        var build_temp_dir = path.join(self.rootDir, 'common_temp_build');

        var commonPage = {
            srcDir: src_temp_dir,
            destDir: build_temp_dir,
            inputCharset: config.charset,
            outputCharset: config.charset,
            config: config.common || {},
            sourceBase: self.getCommonDir()
        };

        var reporter = [];

        async.series([
            //准备临时目录
            function (callback){
                // console.log('buildCommon: %s', 'prepare');
                async.forEach([commonPage.srcDir, commonPage.destDir], function (absdir, callback){
                    fs.exists(absdir, function(exist) {
                        if (exist) {
                            fu.rmTree(absdir, function (err) {
                                if (err) {
                                    return callback(err);
                                }
                                fs.mkdir(absdir, callback);
                            });
                            return;
                        }
                        fs.mkdir(absdir, callback);

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
                async.forEachSeries(self._plugins, function(plugin, callback) {
                    plugin(commonPage, function (err, rep) {
                        if (err) {
                            callback(err);
                        }

                        if (rep && rep.name) {
                            reporter.push(rep);
                        }

                        callback();

                    });
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

        ], function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, reporter);
        });
    },

    _loadPlugins: function() {
        var self = this;

        var pluginConfig = {
            base: './'
        };

        self.use(require('./plugins/common-module-compiler')(pluginConfig));
        self.use(require('./plugins/xtemplate')(pluginConfig));
        self.use(require('./plugins/kissy-template')(pluginConfig));
        self.use(require('./plugins/template-back')(pluginConfig));
        self.use(require('./plugins/css-combo')(pluginConfig));
        self.use(require('./plugins/lesscss')(pluginConfig));
        self.use(require('./plugins/uglifyjs')(pluginConfig));
        self.use(require('./plugins/cssmin')(pluginConfig));
    },

    /**
     * analyze app for dependence
     * @param callback
     */
    analyze: function (callback) {
        var self = this;
        self.getConfig(function(err){
            if (err) {
                return callback(err);
            }
            self.getPages(function(err, pages){
                if (err) {
                    return callback(err);
                }
                async.mapSeries(pages, function(page, callback) {
                    var fbPage= self.getPage(page.name, page.version);
                    fbPage.analyze(function(err, report) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, {
                            name: page.name,
                            version: page.version,
                            report: report
                        });
                    });
                }, callback);
            });
        });
    },

    /**
     * add plugin to Page
     * @param  {Object} plugin the Page Plugins
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
        fu.readJSON(path.join(self.rootDir, App.FB_JSON_NAME), function (err, json) {
            if (err) {
                return callback(err);
            }
            self.config = _.defaults(json, App.defaultConfig);
            var groups = self.config.groups;
            var newGroup = {};
            if (groups) {
                _.each(groups, function (pages, gname) {
                    if (pages) {
                        newGroup[gname] = pages.map(function (page) {
                            var p = Page.parsePageVersion(page);
                            return p.name + '/' + p.version
                        });
                    }
                });
            }
            self.config.groups = newGroup;
            callback(null, self.config);
        });
    },

    /**
     * save config to file
     * @param  {Function} callback with(err);
     */
    saveConfig: function (callback) {
        var self = this;

        if (!self.config) {
            self.config = App.defaultConfig;
        }

        var json_path = path.join(self.rootDir, App.FB_JSON_NAME);

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
        var error = new Error();
        error.name = 'EsetGroup';

        var parsedPages = [];
        var parsed;

        if (!self.testGroupName(groupName)) {
            error.message = 'GroupName not valid;'
            return callback(error);
        }

        //parse input
        for(var i = 0; i < pages.length; i++) {
            parsed = Page.parsePageVersion(pages[i]); 
            if (!parsed) {
                error.message = 'Page ' + pages[i] + 'is not valid';
                return callback(error);
            }
            parsedPages.push(parsed);
        }
        // check repeat version
        var itemCounter2orMore = _.chain(parsedPages)
            .groupBy(function (item) {
                return item.name;
            })
            .find(function (item) {
                return item.length >= 2;
            }).value();

        if (itemCounter2orMore) {
            error.message = 'version repeat';
            return callback(error);
        }


        pages = _.chain(parsedPages)
            .map(function (page) {
                return page.name + '/' + page.version;
            })
            .uniq()
            .value();

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

        self.getGroup(groupName, function (err, pages) {
            if (err) {
                return callback(err);
            }

            async.forEach(groups, function (page, callback) {
                var parsed = Page.parsePageVersion(page);

                if (!parsed.name || !parsed.version) {
                    var msg = util.format('Page "%s" is not valid', page);
                    callback(new Error(msg));
                }

                var page = app.getPage(parsed.name, parsed.version);

                page.build(timestamp, callback);

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