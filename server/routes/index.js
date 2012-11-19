var Page = require('../../lib/page.js');
var App = require('../../lib/app.js');
var path = require('path');
var _ = require('underscore');
var util = require('util');
var async = require('async');
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
            tag: '20121119',
            ksDebug: ('ks-debug' in req.query)
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
                ksDebug: ('ks-debug' in req.query),
                tag: '20121119'
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

    fbpage.getTimestamps(function (err, timestamps) {

        res.render('version', {
            title: fbpage.name,
            pageConfig : {
                name: 'fbpage',
                version: '1.0',
                timestamp: '20120722',
                ksDebug: ('ks-debug' in req.query),
                tag: '20121119'
            },
            page: fbpage,
            app: fbapp,
            timestamps: timestamps
        });

    });

};

exports.buildPages = function (req, res, next) {

    var pages = req.param('pages');
    var timestamp = req.param('timestamp');

    if (!pages) {
        res.send({
            err: {
                message: 'no page to build'
            }
        });
        return;
    }

    pages = pages.split(',');

    async.map(pages, function (page, callback) {
        var fbapp = req.fbapp;

        if (!fbapp) {
            return callback(new Error('no app'));
        }

        var p = Page.parsePageVersion(page);

        if (!p) {
            return callback(new Errow('pageVersion is not valid'));
        }

        var fbpage = fbapp.getPage(p.name, p.version);

        fbpage.build(timestamp, function (err, reports) {
            if (err) {
                return callback(err);
            }
            callback(null, reports);
        });

    }, function (err, reports) {

        if (err) {
            var stack = err.stack;

            err.stack = null;
            delete err.stack;
            res.send({
                err: {
                    message: err.message,
                    text: JSON.stringify(err, null, 2),
                    stack: stack
                }
            });
            return;
        }
        res.send({
            err: null,
            reports: reports,
            pages: pages
        });
    });

};

exports.addPage = function (req, res, next) {
    var fbapp = req.fbapp;
    var pageName = req.param('pagename');
    var version = req.param('version');
    if (!pageName || !version) {
        var error = new Error();
        error.name = 'addPage Error';
        error.message = 'no pagename or version';
        next(error);
        return;
    }

    fbapp.addPage(pageName + '/' + version, function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('back');
    });
};

exports.analyzePage = function (req, res, next) {
    var app = req.fbapp;
    var page = req.fbpage;
    page.analyze(function (err, report) {
        if (err) {
            return next(err);
        }
        res.send(report);
    });
};

exports.openFile = function(req, res, next) {
    var p = req.query.path;
    var commandOpen = require('../../lib/command-open');

    commandOpen(p, function(err) {
        if (err) {
            res.end('can not open');
            return;
        }
        res.end('open success!');
    });
};