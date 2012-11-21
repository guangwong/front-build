var http = require('http');
var App = require('../lib/app');
var Page = require('../lib/page');

var apps = {};


exports.init = function (io) {
    io.sockets.on('connection', function (socket) {
        var app;

        function onError(err) {
            socket.emit('error', err);
        }

        socket.emit('connected', { hello: 'world' });

        socket.on('init', function (data, callback) {
            if(!app) {
                App.getApp(data.rootDir, function (err, fbapp) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    app = fbapp;
                    callback(null);
                });
            }
        });




        socket.on('watch_common', function () {
            console.log('auto build common');
            app.autoBuildCommon();

            app.on('common_build_success', function (data) {
                console.log('common_build_success');
                socket.emit('common_build_success', data);
            });

            app.on('common_build_error', function (data) {
                console.log('common_build_error');
                socket.emit('common_build_error', data);
            });
        });

        socket.on('disconnect', function () {
            if (app) {
                console.log('stop auto build common');
                app.stopAutoBuildCommon();
            }
        });

    });
};