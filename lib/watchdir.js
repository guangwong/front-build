var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var events = require('events');
var async = require('async');

module.exports = watchDir;

function watchDir (dir, options) {
    var self = this;
    self.files = [];
    self.watchers = [];
    self._watch(dir, function (err) {
        if(err) {
            self.emit('error', '_watch error');
            return;
        }
        self.files.forEach(function (p) {
            var watcher = fs.watch(p);
            watcher.on('change', self._onChange);
            watcher.on('error', self._onError);
            self.watchers.push(watcher);
        });
    });
}

_.extend(watchDir.prototype, events.EventEmitter, {
    _onChange: function (type, filename) {
        self.emit('change', filename);
    },
    _onError: function (error) {
        self.emit('error', error);
    },
    _watch: function (callback) {
        var self = this;
        var dir = path.resovle(dir);
        fs.stat(dir, function(err, stat) {
            if (err) {
                return callback(err);
            }

            if(!stat.isDirectory()) {
                var error = new Error('The gaven path is not a directory!');
                error.name = 'ENOTDIR';
                return callback(error);
            }

            fs.readdir(dir, function(err, filenames){
                if (err) {
                    return callback(err);
                }
                if (filenames.length === 0) {
                    callback(null);
                    return;
                }

                async.forEach(filenames, function(p, callback) {
                    var ap = path.resolve(dir, p);
                    fs.stat(ap, function (err, stat) {
                        if (err) {
                            return callback(err);
                        }
                        if (stat.isFile()) {
                            self.files.push(ap);
                            callback();
                            return;
                        }

                        if (stat.isDirectory()){
                            self._watch(ap, callback);
                            return;
                        }

                        callback(null);

                    });
                }, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    self.files.push(dir);
                    callback(null);
                });
            })
        });
    }
});