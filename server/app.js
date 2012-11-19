/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , App = require('../lib/app')
    , Page = require('../lib/page')
    , kissyPieVersion = '...';

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 8765);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(function (req, res, next) {
        var rootDir = req.param('root');

        if (!rootDir) {
            next();
            return;
        }
        App.getApp(rootDir, function (err, app) {
            if (err) {
                return next(err);
            }
            req.fbapp = app;
            next();
            return;
        });
    });
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});
app.param('pageVersion', function (req, res, next, pageVersion) {
    var fbapp = req.fbapp;
    if (!fbapp) {
        return next(new Error('no app'));
    }
    var p = Page.parsePageVersion(pageVersion);
    if (!p) {
        return next(new Errow('pageVersion is not valid'));
    }
    var page = fbapp.getPage(p.name, p.version);
    req.fbpage = page;
    next();
});

app.get('/', routes.index);
app.get('/app', routes.app);
app.get('/page/:pageVersion', routes.page);
//app.get('/app/analyze', routes.analyzeApp);

app.get('/analyze-page/:pageVersion', routes.analyzePage);
app.get('/build-pages', routes.buildPages);
app.get('/build-common', routes.buildCommon);
app.post('/build-common', routes.buildCommon);
app.post('/add-page', routes.addPage);
app.get('/openfile', routes.openFile);
app.get('/pid', function (req, res) {
    res.end(process.pid.toString());
});

app.locals({
    getUrl:function (path, obj) {
        return require('url').format({
            protocol:'http',
            hostname:'127.0.0.1',
            port:'8765',
            query:obj,
            pathname:path
        });
    },
    version:require('../package.json').version,
    currentStable: function () {
        return kissyPieVersion;
    }
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});


var checkVersionUrl = 'http://a.tbcdn.cn/mods/front-build/current-kissy-pie-version.js?t=' + (new Date().getTime());


http.get(checkVersionUrl,function (res) {
    res.setEncoding('utf8');
    res.on('data', function (d) {
        var match = d.match(/\/\*\*ver (.*) ?\*\*\//);

        if (match) {
            kissyPieVersion = match[1].trim();
        }

        console.log('current installed:', require('../package.json').version);
        console.log('latest stable:', kissyPieVersion);
    });

}).on('error', function (err) {
    kissyPieVersion = 'error';
});
