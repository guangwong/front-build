var fs = require('fs');
var path = require('path');
var should = require('should');
var async = require('async');
var fu = require('../lib/fileutil');
var App = require('../lib/app');

describe('app init', function (){
    var rootDir = path.resolve('tmp_project_dir');

    before(function (done){
        if(path.existsSync(rootDir)) {
            fu.rmTreeSync(rootDir);
        }

        fs.mkdir(rootDir, function (err) {
            if(err) {
                return done(err);
            }
            App.init(rootDir, done);
        });

    });

    after(function() {
    	fu.rmTreeSync(rootDir);
    });

    it('should create a config file in rootDir', function (done) {
    	var fb_json_file = path.resolve(rootDir, 'fb.json');

        fu.readJSON(fb_json_file, function (err, json){
            if (err) {
                return done(err);
            }
            json.should.be.ok;
            should.exist(json.fbversion);
            done();
        });
    });

    it('should create common directories', function (done) {
        var dir = path.resolve(rootDir, 'common');
        fs.stat(dir, function (err, stat) {
            if (err) {
                return done(err);
            }
            stat.isDirectory().should.be.true;
            done();
        });

    });

    it('should create a "utils" directories', function (done) {
        var dir = path.resolve(rootDir, 'utils');
        fs.stat(dir, function (err, stat) {
            if (err) {
                return done(err);
            }
            stat.isDirectory().should.be.true;
            done();
        });
    });

    it('should create a "common" directories', function (done) {
        var dir = path.resolve(rootDir, 'tools');

        fs.stat(dir, function (err, stat) {
            if (err) {
                return done(err);
            }
            stat.isDirectory().should.be.true;
            done();
        });
    });

    // it('should return an error when groupName is not valid', function (done) {
    //     app.setGroup('-notvalid', 'page@1.0', function(err) {
    //         err.should.be.ok;
    //         done();
    //     });
    // });

    // it('should return an error when pageName is not valid', function (done) {
    //     app.setGroup('-notvalid', 'page-1.0', function(err) {
    //         err.should.be.ok;
    //         done();
    //     });
    // });
});

describe('app#getCurrent', function () {
    var app;
    var rootDir = path.resolve('sample-project');

    before(function (){
    });

    it('should return null if cwd is blank', function(){
        var app = new App({
            rootDir: rootDir
        });
        var current = app.getCurrent();
        should.not.exist(current.version);
        should.not.exist(current.pageName);
    });

    it('should get current PageName', function(){
        var pageName = 'page1';

        var app = new App({
            rootDir: rootDir,
            workDir: pageName
        });

        var current = app.getCurrent();

        current.pageName.should.eql(pageName);
        should.not.exist(current.version);
    });

    it('should get current PageName and version', function(){
        var pageName = 'page1/1.0';

        var app = new App({
            rootDir: rootDir,
            workDir: pageName
        });

        var current = app.getCurrent();

        current.pageName.should.eql('page1');
        current.version.should.eql('1.0');
    });

    it('should get current PageName and version', function(){
        var pageName = 'page1/1.0/mods';

        var app = new App({
            rootDir: rootDir,
            workDir: pageName
        });

        var current = app.getCurrent();

        current.pageName.should.eql('page1');
        current.version.should.eql('1.0');
    });

});

describe('App#testPageName', function() {
    var app;
    var rootDir = path.resolve('sample-project');

    before(function (){
        app = new App({rootDir: rootDir});
    });

    it('should not be common, utils, docs', function (){
        app.testPageName('common').should.be.false;
        app.testPageName('utils').should.be.false;
        app.testPageName('docs').should.be.false;
    });

    it('should not start with "-" ', function (){
        app.testPageName('-pagename').should.be.false;
    });

    it('should return true with some valid pageName', function (){
        app.testPageName('index').should.be.true;
        app.testPageName('info').should.be.true;
        app.testPageName('detail').should.be.true;
        app.testPageName('list').should.be.true;
    });

});

describe('App#testPageVersion', function() {
    var app;
    var rootDir = path.resolve('sample-project');

    before(function (){
        app = new App({rootDir: rootDir});
    });

    it('should only contain one "@"', function () {
        app.testPageVersion('page1@@1.0').should.be.false;
        app.testPageVersion('p@2.0').should.be.true;
        app.testPageVersion('p@2.0@').should.be.false;
    });

    it('should have version after pageName', function () {
        app.testPageVersion('1.0@p1').should.be.false;
    });

    it('should not be common, utils, docs', function (){
        app.testPageVersion('common@1.0').should.be.false;
        app.testPageVersion('utils@1.0').should.be.false;
        app.testPageVersion('docs@1.0').should.be.false;
    });

    it('should not start with "-" ', function (){
        app.testPageVersion('-pagename@1.0').should.be.false;
    });

    it('should return true with some valid pageName', function (){
        app.testPageVersion('index@1.0').should.be.true;
        app.testPageVersion('info@1.0.1').should.be.true;
        app.testPageVersion('_detail@10.11.11111').should.be.true;
        app.testPageVersion('_list-index@0.1.1').should.be.true;
    });
});

describe('App#getGroups,App#setGroup, App#getGroup, App#rmGroup', function () {
    var app;
    var rootDir = path.resolve('sample-project');

    before(function (){
        app = new App({rootDir: rootDir});
    });

    it('should setGroup without any error', function (done) {
        app.setGroup('test_group1', ['page1@1.0', 'page2@2.0'], done);
    });

    it('should get all groups', function(done){
        app.getGroups(function (err, groups) {
            if (err) {
                return done(err);
            }
            should.exist(groups['test_group1']);

            groups['test_group1'].should.be.eql(['page1@1.0', 'page2@2.0']);
            done();
        });
    });

    it('should getGroups', function(done){
        app.getGroup('test_group1', function (err, pages) {
            if (err) {
                return done(err);
            }
            pages.should.be.eql(['page1@1.0', 'page2@2.0']);
            done();
        });
    });

    it('should remove group with rmGroup', function(done) {
        app.rmGroup('test_group1', function (err) {
            if (err) {
                return done(err);
            }
            app.getGroup('test_group1', function (err, pages) {
                err.should.be.ok;
                should.not.exist(pages);
                done();
            });
        });
    });
});

describe('app#addPage test', function () {
    var app;
    var pageName = '_testaddpage';
    var version = '10.11';
    var rootDir = path.resolve('./sample-project');
    var page;
    var pageVersion =  pageName + '/' + version;
    before(function (done) {
        app = new App({
            rootDir: rootDir
        });
        
        app.addPage(pageVersion, done);
    });

    after(function (done) {
        fu.rmTreeSync(path.resolve(rootDir, pageName));
        done();
    });
    
    it('should create a version directory', function (done) {
        fs.stat(path.resolve(rootDir, pageName), function(err, stat){
            if (err) {
                return done(err);
            }
            stat.isDirectory().should.be.true;
            done(null);
        });
    });

    it('should create a fb.page.json', function (done) {
        fu.readJSON(path.resolve(rootDir, pageName, version, 'fb.page.json'), function(err, json){
            if (err) {
                return done(err);
            }
            json.should.be.ok;
            done();
        });
    });
});

describe('test app buildCommon', function(){
    var app;
    var rootDir = path.resolve('sample-project');

    var files = [
        'index.js',
        'main.css',
        'style.less'
    ];

    var minFiles = [
        'index-min.js',
        'main-min.css',
        'style-min.css'
    ];

    before(function (done) {
        app = new App({
            rootDir: rootDir
        });
        
        app.buildCommon(done);

    });

    after(function (done){
        async.forEach(minFiles, function (file, callback){
            fs.unlink(path.resolve(rootDir, 'common', file), callback);
        }, done);
    });

    it('should build files to -min', function(done) {
        async.map(minFiles, function (file, callback) {
            fs.stat(path.resolve(rootDir, 'common', file), callback);
        }, function (err, stats){
            if (err) {
                return done(err);
            }
            stats.forEach(function (stat) {
                stat.isFile().should.be.true;
            });

            done();
        })
    });
});

describe('app#update test', function() {
    var app;
    var rootDir = path.resolve('sample-project');

    before(function (done) {
        app = new App({
            rootDir: rootDir
        });

        app.update(done);
    });
});