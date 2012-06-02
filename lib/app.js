var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var fu = require('./fileutil')

var App = module.exports = function(cfg) {
    var self = this;
    self.root = cfg.root;
    self.workdir = cfg.workdir;
    self.config = cfg.config;
};

_.extend(App, {
    init: function(dir, config, cb){
        var rootdir = path.resolve(dir);

        var config = config || {};

        fu.writeJSONSync(path.resolve(rootdir, 'fb.json'), config);

        console.log('file "fb.json" created');

        App.RootDirs.forEach(function(p){
            console.log('dir "%1" created', p);
            fs.mkdirSync(path.resolve(rootdir, p));
        });

        cb(null);
    },

    RootDirs: ['tools','docs','common', 'utils'],
    PageDirs: ['core', 'mods', 'test'],
    VersionReg: /^\d+\.\d+$/,
    TimestampReg: /^\d{6+}$/
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

    }
});