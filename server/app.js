
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , App = require('../lib/app')
  , Page = require('../lib/page')

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8765);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(function (req, res, next) {
    if (!req.query.root) {
      next();
      return;
    }

    App.getApp(req.query.root, function (err, app) {
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

app.configure('development', function(){
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
  var page = fbapp.getPage(p.pageName);
  page.setVersion(p.version, function (err) {
    if (err) {
      return next(err);
    }
    req.fbpage = page;
    next();
  });
});

app.get('/', routes.index);
app.get('/app', routes.app);
app.get('/page/:pageVersion', routes.page);
app.get('/build-page/:pageVersion', routes.buildPage);
app.get('/build-common', routes.buildCommon);
app.post('/build-common', routes.buildCommon);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
