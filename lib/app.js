var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var fu = require('./fileutil');
var async = require('async');

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
};

_.extend(App, {
    RootDirs: ['tools','docs','common', 'utils'],
    PageDirs: ['core', 'mods', 'test'],
    version: '0.03',
    FB_JSON_NAME: 'fb.json',
    versionReg: /^\d+\.\d+$/,
    timestampReg: /^\d{6+}$/,
    defaultConfig: {
        version: '0.03',
        charset: 'utf8'
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
                return callback(new Error('Already initd as a FB project;'));
            }

            var app =  new App({
                rootDir: dir
            });

            async.series([
                function (callback) {
                    //create directories
                    async.forEach(App.RootDirs, function (p, callback) {
                        var tPath = path.resolve(dir, p)
                        path.exists(tPath, function (exist) {
                            if (exist) {
                                console.log('directory exist: %s', p);
                                return callback(null);
                            }
                            console.log('directory created: %s', p);
                            fs.mkdir(tPath, callback);
                        });
                    }, callback);
                },

                function (callback) {
                    //create fb.json
                    console.log('file "%s" created.', App.FB_JSON_NAME);
                    app.saveConfig(callback);
                    
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
                    stat = fs.statSync(path.resolve(currentPath,'fb.json'));;

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

        try {
            var config = fu.readJSONSync(path.resolve(rootdir, 'fb.json'));
        } catch (e) {
            return callback(e);
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
    }

});

_.extend(App.prototype, {
    /**
     * Add page to app
     * @param {String} pageName name of page
     * @param {Function} callback will be called with (error);
     */
    addPage: function(pageName, callback) {
        var self = this;
        //黑名单
        var blacklist = _.extend([], App.RootDirs, App.PageDirs);

        if (blacklist.indexOf(pageName) != -1 ) {
            callback(new Error('App#addPage: name error'));
            return;
        }

        if (!pageName) {
            callback(new Error('App#addPage: Page Name is Not found.'));
            return;
        }

        var target = path.resolve(self.rootDir, pageName);


        if (!path.exists(target)) {
            console.log('page %s created', pageName);
            fs.mkdir(target, callback);
        } else {
            console.log('Page %s exists!', pageName);
            callback(null);
        }

    },

    /**
     * 通过pagename 返回一个page
     * @return {Page} the target Page
     */
    getPage: function(pageName, callback){
        var self = this;
        pageName = pageName || self.getCurrent().pageName;

        if (pageName) {
            page = new Page({
                name: pageName,
                app: self,
                rootDir: path.resolve(self.rootDir, pageName)
            });
        } else {
            return callback(new Error('Page#getPage: no page name;'));
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
     * build the common
     * @param {Function} callback called with (err)
     */
    buildCommon: function (callback){
        console.log('TODO: build common');
        callback();
    },

    /**
     * get config
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
            self.config = App.defaultConfig
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
     * check the page name
     * @param  {String} pageName name of page (name@version);
     * @return {Boolean}          return true if name valid
     */
    testPageName: function(pageName) {
        if (App.RootDirs.indexOf(pageName) != -1) {
            return false;
        }
        return /^[_a-z0-9][-_a-z0-9]*$/i.test(pageName);
    },

    testPageVersion: function(page_version) {
        var self = this;

        if (!/^[_a-z0-9][-_a-z0-9]*@(\d+\.)+(\d)+$/i.test(page_version)){
            return false;
        }

        var pageName = page_version.split('@')[0];

        return self.testPageName(pageName);
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
            if (!self.testPageVersion(pages[i])) {
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
     * get group by name
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

    buildGroup: function (groupName, timestamp) {

        self.getGroups(function (err, groups) {
            if (err) {
                return callback(err);
            }

            async.forEach(groups, function (page, callback) {
                var parsed = Page.parse(page);

                if (!parsed.pageName || !parsed.version) {
                    return callback(new Error('page name or page Version is not defined'));
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