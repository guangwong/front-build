var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var events = require('events');
var async = require('async');

module.exports = watchDir;

function watchDir(dir, options) {
    var self = this;
    if (!(self instanceof watchDir)) {
        return new watchDir(dir, options);
    }
    self.rootDir = dir;
    self.filetree = null;
    self.dirs = [];

    // 文件目录发生变动， 重新扫描文件
    self.on('rename', function (ev, tree) {
        if (self.filetree) {

            self._stopMonitor(self.filetree);
            self.filetree = null;
            self.initWatch(function (err) {
                if (err) {
                    self.emit('error', err);
                }
            });
        }
    });

    self.initWatch(function (err) {
        if (err) {
            self.errmit('error', err);
        }
        self.emit('init');
    });

}

_.extend(watchDir.prototype, events.EventEmitter.prototype, {

    _test: function (p) {
        var self = this;
        return !(['.git', '.svn'].indexOf(p) === -1);
    },

    initWatch: function (callback) {
        var self = this;

        if (self.filetree) {
            return callback(null, self.filetree);
        }
        self._watch(self.rootDir, function (err, tree) {
            if (err) {
                return callback(err);
            }
            self.filetree = tree;
            self._monitor(tree);
        });
    },

    _watch: function (dir, callback) {
        var self = this;
        dir = path.resolve(dir);
        // console.log('_watch', dir);
        fs.stat(dir, function(err, stat) {
            if (err) {
                return callback(err);
            }

            if(!stat.isDirectory()) {
                var error = new Error('The gaven path is not a directory!');
                error.name = 'ENOTDIR';
                return callback(error);
            }
            var tree = {
                filename: dir,
                isDirectory: true,
                files: null
            };

            fs.readdir(dir, function(err, filenames){
                if (err) {
                    return callback(err);
                }

                if (filenames.length === 0) {
                    callback(null, tree);
                    return;
                }

                var files = [];

                async.forEach(filenames, function(p, callback) {
                    if (self._test(p)) {
                        return callback(null);
                    }

                    // console.log('\t', p);
                    var ap = path.resolve(dir, p);
                    fs.stat(ap, function (err, stat) {
                        if (err) {
                            return callback(err);
                        }
                        if (stat.isFile()) {
                            files.push({
                                filename: ap,
                                isDirectory: false
                            });
                            callback();
                            return;
                        }

                        if (stat.isDirectory()){
                            self._watch(ap, function (err, tree) {
                                if (err) {
                                    return callback(err);
                                }
                                files.push(tree);
                                return callback(null);
                            });
                            return;
                        }

                        callback(null);

                    });
                }, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    
                    tree.files = files;
                    callback(null, tree);
                });
            })
        });
    },

    _monitor: function(tree) {
        var self = this;
        if (!tree.watcher) {
            tree.watcher = fs.watch(tree.filename);
        }
        tree.watcher.on('change', function (ev) {
            if (ev === 'rename') {
                self.emit('rename', tree);
            }
            if (ev === 'change') {
                self.emit('change', tree);
            }
        });

        if (tree.files && tree.files.length) {
            tree.files.forEach(function (file) {
                self._monitor(file);
            });
        }
    },

    _stopMonitor: function (tree) {
        var self = this;

        if (tree.watcher) {
            tree.watcher.removeAllListeners();
            tree.watcher.close();
            tree.watcher = null;
        }

        if (tree.files && tree.files.length) {
            tree.files.forEach(function (file) {
                self._stopMonitor(file);
            });
        }
    }
});