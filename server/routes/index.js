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
            return page.name;
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
    var fbapp = req.fbapp;
    var fbpage = req.fbpage;

    fbpage.getTimestamps(function (timestamps) {

        res.render('version', {
            title: fbpage.name,
            pageConfig : {
                name: 'fbpage',
                version: '1.0',
                timestamp: '20120722',
                tag: '20120722'
            },
            page: fbpage,
            app: fbapp,
            timestamps: timestamps
        });

    });

};



exports.buildPage = function (req, res, next) {
    var fbapp = req.fbapp;
    if (!fbapp) {
        return next(new Error('no app'));
    }
    var fbpage = req.fbpage;

    if (!fbpage) {
        return next(new Error('no page'));
    }

    var timestamp = req.param('timestamp');

    fbpage.build(timestamp, function (err, reports) {
        res.send({
            err: err ? {
                message: err.message
            } : null,
            reports: reports
        });
    });

};