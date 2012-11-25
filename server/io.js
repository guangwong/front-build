var http = require('http');
var App = require('../lib/app');
var Page = require('../lib/page');

var apps = {};


exports.init = function (io) {
    io.sockets.on('connection', function (socket) {
        var app;
        var currentPage;

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




        socket.on('start_watch_common', function () {
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

        socket.on('stop_watch_common', function () {
            app.stopAutoBuildCommon();
        });

        socket.on('start_auto_build_page', function (page) {
            currentPage = app.getPage(page.name, page.version);
            currentPage.on('build_success', function (rep) {
                socket.emit('page_build_success', rep);
            });
            currentPage.on('build_fail', function (err) {
                socket.emit('page_build_fail', err);
            })
        });

        socket.on('stop_auto_build_page', function (page) {
            currentPage.stopAutoBuild();
        });

        socket.on('disconnect', function () {
            if (app) {
                console.log('stop auto build common');
                app.stopAutoBuildCommon();
            }
            if (currentPage && currentPage.isWatching) {
                currentPage.stopAutoBuild();
            }
        });

    });
};