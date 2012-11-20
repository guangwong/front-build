var http = require('http');
var App = require('../lib/app');
var Page = require('../lib/page');

var apps = {};


exports.init = function (io) {
    io.sockets.on('connection', function (socket) {
        function onError(err) {
            socket.emit('error', err);
        }

        socket.emit('connected', { hello: 'world' });

        socket.on('watch_common', function (data) {
            var app = apps[data.rootDir];
            if(!app) {
                app = App.getApp(data.rootDir, function (err, app) {
                    if (err) {
                        onError(err);
                        return;
                    }
                    apps[data.rootDir] = app;
                });
                return;
            }

        });
    });
};