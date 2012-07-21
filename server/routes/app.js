var path = require('path');
var _ = require('underscore');
var App = require('../../lib/app.js');

exports.app = function (req, res) {
    var root = req.query.root;
    App.getApp(root, function (err, app) {
        if (err) {
            return req.next(err);
        }
        app.getPages(function (err, pages) {
            if (err) {
                return req.next(err);
            }
            var grouped = _.groupBy(pages, function (page) {
                return page.pageName;
            });

            res.render('app', {
                title: path.basename(app.rootDir),
                app: app,
                groups: grouped
            });
        });
    });
};

exports.addPage = function (req, res) {
    
};