var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var util = require('util');
module.exports = WatchDir;

/**
 * File Tree
 * @param {String} path root path
 * @param {Array} subs  sub Trees
 */
function FileTree(path, subs) {
    var self = this;
    EventEmitter.call(self);
    self.path = path;
    self.subs = null;

    if (subs && subs.forEach) {
        self.subs = _(subs).filter(function (tree) {
            return tree instanceof FileTree;
        });
    }
}

util.inherits(FileTree, EventEmitter);

_(FileTree.prototype).extend({
    watch: function () {
        var self = this;
        try {
//            console.log('watch:', self.path);
            self.watching = fs.watch(self.path, function (ev) {
                //文件的rename不监控，　因为所在目录肯定会有rename
                if (!self.subs && ev === 'rename') {
                    return;
                }

                self.emit(ev, {
                    path: self.path
                });

            });
        } catch (e) {
            console.log("watch error: ", self.path, self.subs);
            console.dir(e);
            //do nothing maybe this file is just deleted;
        }

        if (self.subs && self.subs.length) {
            self.subs.forEach(function (subtree) {
                subtree.watch(subtree);
                subtree.on('change', function (ev) {
                    self.emit('change', ev);
                });
                subtree.on('rename', function (ev) {
                    self.emit('rename', ev);
                });
            });
        }
    },

    stopWatch: function () {
        var self = this;

        if (self.watching) {
            self.watching.close();
            self.watching = null;
        }

        if (self.subs && self.subs.length) {
            self.subs.forEach(function (subtree) {
                subtree.stopWatch();
                subtree.removeAllListeners('change');
                subtree.removeAllListeners('rename');
            });
        }
    }
});

function WatchDir(dir, options) {
    var self = this;
    EventEmitter.call(self);

    if (!(self instanceof WatchDir)) {
        return new WatchDir(dir, options);
    }
    self.rootDir = dir;
    self.dirs = [];
    self.options = options || {};
    self.init();
}

WatchDir.defaultConfig = {
    ignores: ['.*']
}

util.inherits(WatchDir, EventEmitter);

_(WatchDir.prototype).extend({
    init: function () {
        var self = this;
        self._initWatch(function (err) {
            if (err) {
                self.emit('error', err);
                return;
            }
            self.emit('init');
        });
    },
    
    /**
     * stop Monitoring
     * @return {WatchDir} self
     */
    stop: function () {
        var self = this;
        self.removeAllListeners();

        if (self.filetree) {
            self.filetree.stopWatch();
        }

        return self;
    },

    _test: function (p) {
        var self = this;
        return !(['.git', '.svn'].indexOf(p) === -1);
    },

    _initWatch: function (callback) {
        var self = this;

        if (self.filetree) {
            self.filetree.removeAllListeners();
            self.filetree.stopWatch();
        }

        self._scan(self.rootDir, function (err, tree) {
            if (err) {
                callback(err);
                return;
            }

            if (!tree) {
                self.fire('error', new Error('WatchDir: Directory not Exist'));
                callback();
                return;
            }
            /**
             * tree of directory
             * @type {FileTree}
             */
            self.filetree = tree;
            self._monitor();
            callback();
        });
    },

    /**
     * get tree of given directory
     * @param  {String}   dir      directory to scan
     * @param  {Function} callback call with error, tree
     */
    _scan: function (dir, callback) {
        var self = this;
        dir = path.resolve(dir);

        fs.stat(dir, function(err, stat) {

            if (err) {
                return callback(null, null);
            }

            if(!stat.isDirectory()) {
                var error = new Error('The given path is not a directory!');
                error.name = 'EWatchDir';
                return callback(error);
            }

            fs.readdir(dir, function(err, filenames) {

                if (err) {
                    return callback(err);
                }

                async.map(filenames, function(p, callback) {

                    if (self._test(p)) {
                        return callback(null);
                    }

                    var ap = path.join(dir, p);

                    fs.stat(ap, function (err, stat) {
                        if (err) {
                            callback(null, null);
                            return;
                        }

                        if (stat.isFile()) {
                            callback(null, new FileTree(ap, null));
                            return;
                        }

                        if (stat.isDirectory()){
                            self._scan(ap, function (err, tree) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                callback(null, tree);
                            });
                            return;
                        }

                        callback(null);

                    });

                }, function (err, subs) {

                    if (err) {
                        return callback(err);
                    }

                    var subs = _.compact(subs);

                    callback(null, new FileTree(dir, subs));
                });
            })
        });
    },

    /**
     * monitor a tree for file change
     */
    _monitor: function() {
        var self = this;

        var tree = self.filetree;
        var changeTimer;
        var renameTimer;

        if (!tree.watching) {
            tree.watch();
        }


        tree.on('change', function (ev) {
            // console.log('- - change', ev.path);
            clearTimeout(changeTimer);
            ev.type = 'change';
            changeTimer = setTimeout(function () {
                self.emit('change', ev);
            }, 600);
        });

        // 文件目录发生变动， 重新扫描文件
        tree.on('rename', function (ev) {
            // console.log('- - rename', ev.path);
            self.init();
            
            clearTimeout(renameTimer);
            ev.type = 'rename';

            renameTimer = setTimeout(function () {
                self.emit('change', ev);
            }, 200);
        });
    }

});