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
        var pageName = path.join('page1','1.0');

        var app = new App({
            rootDir: rootDir,
            workDir: pageName
        });

        var current = app.getCurrent();

        current.pageName.should.eql('page1');
        current.version.should.eql('1.0');
    });

    it('should get current PageName and version', function(){
        var pageName = path.join('page1','1.0','mods');

        var app = new App({
            rootDir: rootDir,
            workDir: pageName
        });

        var current = app.getCurrent();

        current.pageName.should.eql('page1');
        current.version.should.eql('1.0');
    });

});

describe('App Group function', function () {
    var app;
    var rootDir = path.resolve('sample-project');

    before(function (){
        app = new App({rootDir: rootDir});
    });

    it('should setGroup without any error', function (done) {
        app.setGroup('test_group1', ['page1/1.0/', 'page2@2.0', 'page3\\1.0'], done);
    });

    it('should setGroup fail if has two version of the same page name', function (done) {
        app.setGroup('test_group2', ['page1/1.0/', 'page2@2.0', 'page3\\1.0', 'page3\\2.0'], function (err) {
            should.exist(err);
            done();
        });
    });

    it('should fail when set Group with wrong pagenames', function (done) {
        app.setGroup('test_group2', ['page1/1.0/', 'page2-2.0'], function (err) {
            should.exist(err);
            done();
        });
    });

    it('should get all groups', function(done){
        app.getGroups(function (err, groups) {
            if (err) {
                return done(err);
            }
            should.exist(groups['test_group1']);

            groups['test_group1'].should.be.eql(['page1/1.0', 'page2/2.0', 'page3/1.0']);
            done();
        });
    });

    it('should get Group with groupName', function(done){
        app.getGroup('test_group1', function (err, pages) {
            if (err) {
                return done(err);
            }
            pages.should.be.eql(['page1/1.0', 'page2/2.0', 'page3/1.0']);
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



describe('app#update test', function() {
    var app;
    var rootDir = path.resolve('sample-project');

    before(function (done) {
        fu.rmTreeSync(path.resolve(rootDir, 'tools'));
        app = new App({
            rootDir: rootDir
        });

        app.update(done);
    });

    it('should create the missing tools directory', function (done) {
        fs.exists(path.resolve(rootDir, 'tools'), function (exist) {
            exist.should.be.true;
            done();
        });
    });
    it('should create the missing tools files', function (done) {
        var file = path.resolve(rootDir, 'tools', 'web-client.sh');
        fs.stat(file, function (err, stat) {
            if (err) {
                return done(err);
            }
            stat.isFile().should.be.true;
            fs.readFile(file, function (err, content) {
                if (err) {
                    return done(err);
                }
                content.length.should.above(0);
                done();
            });
        });
    });
});

describe('app#getPages Test', function() {
    var app;
    var rootDir = path.resolve('sample-project');

    before(function (done) {
        app = new App({
            rootDir: rootDir
        });
        done();
    });

    it('should get all pages', function (done) {
        app.getPages(function (err, pages) {
            if (err) {
                return done(err);
            }
            pages.length.should.eql(4);
            pages.forEach(function (page) {
                should.exist(page.name);
                should.exist(page.version);

            });
            done();
        });
    });


});

describe("App build multi pages", function () {
    var rootDir = path.resolve('sample-project');
    var app = new App({
        rootDir: rootDir
    });
    var timestamp = '20111111';
    var pages = ['page1/1.0', 'page2/1.0'];
    var pubs = ['page1/'+timestamp, 'page2/'+timestamp];

    after(function () {
        pubs.forEach(function (pub) {
            fu.rmTreeSync(path.resolve(rootDir, pub));
        });
    });

    it('should build multipage with no error', function (done) {
        app.buildPages(pages, timestamp, function (err) {
            should.not.exist(err);
            async.forEach(pubs, function (pub, callback) {
                fs.existsSync(path.resolve(rootDir, pub)).should.be.true;
            });
            done();
        });
    });
});


describe('APP#getGlobalConfig', function () {
    var oConfig;

    before(function (done) {
        App.getGlobalConfig(function (json) {
            oConfig = json;
            done();
        });
    });

    it ('should return a Object', function () {
        should.exist(oConfig);
        oConfig.should.be.a('object');
    });

    it ('should extends the default Configs', function () {
        oConfig.packages.should.be.a('object');
    });

    // it ('should read json from default user fb.default.json file', function () {
    //     should.exist(oConfig.packages['common-lib']);
    //     oConfig.packages['common-lib'].should.be.a('object');
    //     oConfig.packages['common-lib'].should.have.property('path');
    // });
});

describe('test App#buildCommon', function () {
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

    after(function (done) {
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