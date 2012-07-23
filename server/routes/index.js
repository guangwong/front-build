var Page = require('../../lib/page.js');
var App = require('../../lib/app.js');
var path = require('path');
var _ = require('underscore');
/*
 * GET home page.
 */

exports.index = function (req, res) {
    res.render('index', {
        title: 'Front Build',
        pageConfig : {
            name: 'fbindex',
            version: '1.0',
            timestamp: '20120722',
            tag: '20120722'
        }
    });
};

exports.app = function (req, res, next) {
    var app = req.fbapp;

    if (!app) {
        return next(new Error('no app'));
    }

    app.getPages(function (err, pages) {
        if (err) {
            return next(err);
        }
        var grouped = _.groupBy(pages, function (page) {
            return page.pageName;
        });

        res.render('app', {
            pageConfig : {
                name: 'fbapp',
                version: '1.0',
                timestamp: '20120722',
                tag: '20120722',
            },
            title: path.basename(app.rootDir),
            app: app,
            groups: grouped
        });
    });
};

exports.buildCommon = function (req, res, next) {
    var app = req.fbapp;
    if (!app) {
        return next(new Error('no app'));
    }
    app.buildCommon(function (err) {
        res.send({
            err: err
        });
    });
}

exports.page = function (req, res, next) {
    var app = req.fbapp;
    var pageName = req.params.pageName;
    var version = req.params.version;

    var p = Page.parsePageVersion(req.params.pageVersion);

    if (!p) {
        return req.next(new Errow('pageVersion is not valid'));
    }

    var page = app.getPage(p.pageName);

    page.setVersion (p.version, function (err) {
        if (err) {
            return next(err);
        }

        page.getTimestamps(function (timestamps) {
            if (err) {
                return next(err);
            }

            res.render('version', {
                title: p.pageName,
                pageConfig : {
                    name: 'fbpage',
                    version: '1.0',
                    timestamp: '20120722',
                    tag: '20120722'
                },
                page: page,
                app: app,
                timestamps: timestamps
            });

        });

    });
};



exports.buildPage = function (req, res) {
    if (!app) {
        return req.next(new Error('no app'));
    }
};