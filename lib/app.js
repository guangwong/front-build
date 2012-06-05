var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var fu = require('./fileutil');
var async = require('async');

var App = module.exports = function(cfg) {
    var self = this;
    self.root = cfg.root;
    self.workdir = cfg.workdir;
    self.config = cfg.config;
};

_.extend(App, {
    RootDirs: ['tools','docs','common', 'utils'],
    PageDirs: ['core', 'mods', 'test'],
    version: '0.03',
    VersionReg: /^\d+\.\d+$/,
    TimestampReg: /^\d{6+}$/,

    error: function(){
        console.log('-- Error --');
        console.log.apply(console, arguments);
        console.log('');
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

        App.getApp(dir, function(err, app) {
            if (err) {
                return callback(err);
            }
            if (app) {
                App.error('%s 已经是一个项目目录了. ', app.root);
                return callback(new Error('init error: only a frontbuild app;'));
            }

            var config = {
                version: App.version
            };
            console.log('file "fb.json" created.');
            async.series([
                function(callback){
                    //create directories
                    async.forEach(App.RootDirs, function(p, callback){
                        fs.mkdir(path.resolve(dir, p), callback);
                        console.log('directorie created: %s', p);
                    }, callback);
                },
                function(callback) {
                    //json
                    fu.writeJSON(path.resolve(dir, 'fb.json'), config, callback);
                }
            ], callback);
        });
        
    },

    /**
     * find the app root by the fb.json file
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

        var workdir = path.resolve(dir),
            page = null,
            rootdir = getRootSync(workdir);

        if(!rootdir) {
            return callback(null);
        }

        try {
            var config = fu.readJSONSync(path.resolve(rootdir, 'fb.json'));
        } catch (e) {
            return callback(e);
        }

        

        callback(null, new App({
            root: rootdir,
            workdir: path.relative(rootdir, workdir),
            config: config
        }));
    }

});

_.extend(App.prototype, {
    /**
     * Add page to app
     * @param {String} pagename name of page
     */
    addPage: function(pagename, callback) {
        //黑名单
        var blacklist = _.extend([], App.RootDirs, App.PageDirs);

        if (blacklist.indexOf(pagename) != -1 ) {
            callback(new Error('name error'));
        }

        if (!pagename) {
            callback(new Error('Page Name is Not found.'));
            return;
        }

        var target = path.resolve(root, pagename);


        if (!path.exists(target)) {
            console.log('page %s created', pagename);
            fs.mkdir(target, cb);
        } else {
            console.log('Page %s exists!', pagename);
            cb();
        }

    },
    /**
     * 返回当前的工作Page
     * @return {Page} the target Page
     */
    getPage: function(){
        var self = this;
        var rel = self.workdir;

        if(rel){
            dirs = rel.replace('\\','/').split('/');
            page = {
                name: dirs[0],
                version: dirs.length >=2 ? dirs[1] : null
            }
        }
    }
});