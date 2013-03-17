var fs = require('fs');
var path = require('path');
var should = require('should');
var async = require('async');
var fu = require('../lib/fileutil');
var App = require('../lib/app');
var Page = require('../lib/page');

describe('app init', function () {
    var rootDir = 'tmp_project_dir';
    var reps;

    before(function (done){
        if(fs.existsSync(rootDir)) {
            fu.rmTreeSync(rootDir);
        }

        fs.mkdir(rootDir, function (err) {
            if(err) {
                return done(err);
            }
            App.init(rootDir, function (err, repoters) {
                if (err) {
                    callback(err);
                    return;
                }
                reps = repoters;
                done();
            });
        });

    });

    after(function() {
    	fu.rmTreeSync(rootDir);
    });

    it('should create a config file in rootDir', function (done) {
    	var fb_json_file = path.join(rootDir, 'fb.json');


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
        var dir = path.join(rootDir, 'common');
        fs.stat(dir, function (err, stat) {
            if (err) {
                return done(err);
            }
            stat.isDirectory().should.be.true;
            done();
        });

    });

    it('should create a "utils" directories', function (done) {
        var dir = path.join(rootDir, 'utils');
        fs.stat(dir, function (err, stat) {
            if (err) {
                return done(err);
            }
            stat.isDirectory().should.be.true;
            done();
        });
    });

    it('should create a "common" directories', function (done) {
        var dir = path.join(rootDir, 'tools');

        fs.stat(dir, function (err, stat) {
            if (err) {
                return done(err);
            }
            stat.isDirectory().should.be.true;
            done();
        });
    });

    it('should give a reporter object to callback function', function () {
        reps.dirs.length.should.eql(4);
        reps.files.length.should.eql(5);
        reps.files.forEach(function(file){
            file.should.have.keys('status', 'filename', 'src');
        });
        reps.dirs.forEach(function(file){
            file.should.have.keys('status', 'filename');
        });
    })
});

describe("App Config", function () {
    var app;
    var rootDir ='sample-project';
    before(function() {
        app = new App({
            rootDir: rootDir
        });
    });
    it('should read config from fb.json', function (done) {
        app.getConfig(function(err, cfg){
            if (err) {
                return done(err);
            }
            cfg.charset.should.eql('gbk', 'charset of project');
            cfg.fbversion.should.eql('0.4.9', 'version of kissypie');
            done();
        });
    });
    it("should get the right charset", function () {
        app.getCharset().should.eql('gbk');
    });
});

describe('app#getCurrent', function () {
    var app;
    var rootDir ='sample-project';

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
    var rootDir = 'sample-project';

    before(function (){
        app = new App({rootDir: rootDir});
    });

    it('should setGroup without any error', function (done) {
        app.setGroup('test_group1', ['page1/1.0/', 'page_with_timestamp@2.0', 'page_with_error\\1.0'], done);
    });

    it('should setGroup fail if has two version of the same page name', function (done) {
        app.setGroup('test_group2', ['page1/1.0/', 'page_with_timestamp@2.0', 'page_with_error\\1.0', 'page_with_error\\2.0'], function (err) {
            should.exist(err);
            done();
        });
    });

    it('should fail when set Group with wrong pagenames', function (done) {
        app.setGroup('test_group2', ['page1/1.0/', 'page_with_timestamp-2.0'], function (err) {
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

            groups['test_group1'].should.be.eql(['page1/1.0', 'page_with_timestamp/2.0', 'page_with_error/1.0']);
            done();
        });
    });

    it('should get Group with groupName', function(done){
        app.getGroup('test_group1', function (err, pages) {
            if (err) {
                return done(err);
            }
            pages.should.be.eql(['page1/1.0', 'page_with_timestamp/2.0', 'page_with_error/1.0']);
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
    var rootDir = './sample-project';
    var page;
    var newPage =  pageName + '/' + version;

    before(function (done) {
        app = new App({
            rootDir: rootDir
        });
        
        app.addPage(newPage, done);
    });

    after(function (done) {
        fu.rmTreeSync(path.join(rootDir, pageName));
        done();
    });
    
    it('should create a version directory', function (done) {
        fs.stat(path.join(rootDir, pageName), function(err, stat){
            if (err) {
                return done(err);
            }
            stat.isDirectory().should.be.true;
            done(null);
        });
    });

    it('should create a fb.page.json', function (done) {
        fu.readJSON(path.join(rootDir, pageName, version, 'fb.page.json'), function(err, json){
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
    var rootDir = 'sample-project';

    before(function (done) {
        fu.rmTreeSync(path.join(rootDir, 'tools'));
        app = new App({
            rootDir: rootDir
        });

        app.update(done);
    });

    it('should create the missing tools directory', function (done) {

        fs.exists(path.join(rootDir, 'tools'), function (exist) {
            exist.should.be.true;
            done();
        });

    });

    it('should create the missing tools files', function (done) {
        var file = path.join(rootDir, 'tools', 'web-client.sh');
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
    var rootDir = 'sample-project';

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
            pages.length.should.eql(5);

            pages.should.includeEql({
                name: 'page1',
                version: '1.0'
            });
            pages.should.includeEql({
                name: 'page1',
                version: '2.0'
            });
            pages.should.includeEql({
                name: 'page_with_error',
                version: '1.0'
            });
            pages.should.includeEql({
                name: 'page_with_timestamp',
                version: '1.0'
            });
            pages.should.includeEql({
                name: 'page_with_timestamp',
                version: '2.0'
            });
            done();
        });
    });
});

describe("build multi pages", function () {
    var rootDir = 'sample-project';
    var app = new App({
        rootDir: rootDir
    });
    var timestamp = '20111111';
    var pages = ['page1/1.0', 'page_with_timestamp/1.0'];
    var pubs = ['page1/'+timestamp, 'page_with_timestamp/'+timestamp];

    after(function () {
        pubs.forEach(function (pub) {
            fu.rmTreeSync(path.join(rootDir, pub));
        });
    });

    it('should build multipage with no error', function (done) {

        app.buildPages(pages, {timestamp: timestamp}, function (err) {
            should.not.exist(err);
            async.forEach(pubs, function (pub, callback) {
                fs.existsSync(path.join(rootDir, pub)).should.be.true;
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

describe('test App build Common', function () {
    var app;
    var rootDir = 'sample-project';

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
    var commonDir = path.join(rootDir, 'common');

    before(function (done) {
        app = new App({
            rootDir: rootDir
        });
        
        app.buildCommon(done);

    });

    after(function (done) {
        fu.findInDir(commonDir, /(-min)\.(js|css)/i, function (err, files) {
            files.map(function(file){
                return path.join(commonDir, file)
            }).forEach(fs.unlinkSync);

            fu.findInDir(commonDir, /(-tpl|-xtpl)\.js$/i, function (err, files) {
                files.map(function(file){
                    return path.join(commonDir, file);
                }).forEach(fs.unlinkSync);
                done();
            });
        });
    });

    it('should build files to -min', function(done) {
        async.forEach(minFiles, function (file, callback) {
            var filename = path.join(rootDir, 'common', file);
            fs.existsSync(filename).should.eql(true, 'file: ' + filename);
            callback();
        }, done);
    });

    it('should build kissy module', function() {
        var indexMinFile = fs.readFileSync(path.join(commonDir, 'index-min.js'), 'utf8');

        indexMinFile.should.include('KISSY.add("common/index",');
        indexMinFile.should.include('KISSY.add("common/mods/a",');
        indexMinFile.should.include('KISSY.add("common/mods/b",');
        indexMinFile.should.include('GBK\\u7f16\\u7801');
    });

    it('should generate kissy template file', function() {
        fs.existsSync(path.join(commonDir, 'template/xxx-xtpl.html')).should.be.ok;
    });

    it('should generate XTemplate file', function() {
        fs.existsSync(path.join(commonDir, 'template/xxx-xtpl.html')).should.be.ok;
    });

});