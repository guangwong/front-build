var Page = require('../lib/page');
var App = require('../lib/app');
var should = require('should');
var path = require('path');
var fs = require('fs');
var fu = require('../lib/fileutil');


describe('Page parser test', function(){
    var src = [
        {
            from: 'page@1.0',
            parsed: {
                pageName: 'page',
                version: '1.0'
            }
        },
        {
            from: 'page/1.0',
            parsed: {
                pageName: 'page',
                version: '1.0'
            }
        },
        {
            from: 'page\\1.0',
            parsed: {
                pageName: 'page',
                version: '1.0'
            }
        },
        {
            from: 'page\\1.0\\',
            parsed: {
                pageName: 'page',
                version: '1.0'
            }
        },
        {
            from: 'page/1.0/',
            parsed: {
                pageName: 'page',
                version: '1.0'
            }
        },
        {
            from: '_~-page/1.0',
            parsed: {
                pageName: '_~-page',
                version: '1.0'
            }
        },
        {
            from: '_/page/1.0',
            parsed: null
        },
        {
            from: '_(page)/1.0',
            parsed: null
        },
        {
            from: '-page/1.0',
            parsed: null
        },
        {
            from: 'page/3.10000.1',
            parsed: {
                pageName: 'page',
                version: '3.10000.1'
            }
        },
        {
            from: 'page/1.0',
            parsed: {
                pageName: 'page',
                version: '1.0'
            }
        },
        {
            from: '_/1.0',
            parsed: {
                pageName: '_',
                version: '1.0'
            }
        },
        {
            from: 'abcdefghijklmnopqrstuvwxyz/1.0',
            parsed: {
                pageName: 'abcdefghijklmnopqrstuvwxyz',
                version: '1.0'
            }
        },
    ];
    it('should parsed all the tests', function(){
        src.forEach(function(item){
            var parsed = Page.parsePageVersion(item.from);
            if (item.parsed === null) {
                should.not.exist(parsed);
            } else {
                parsed.should.be.eql(item.parsed);
            }
        });
    });
});

describe('page build test', function(){
    var pageName = 'page1';
    var app = new App({
        rootDir: path.resolve('sample-project')
    });

    var rootDir = path.resolve('sample-project', pageName);
    var version = '1.0';
    var timestamp = '20121212';
    var thepage;

    before(function (done) {
        thepage = new Page({
            rootDir: rootDir,
            name: pageName,
            app: app
        });

        thepage.setVersion(
            version, 
            function(err){
                if (err) {
                    return done(err);
                }
                thepage.build(timestamp, done);
            }
        );

    });

    after(function (done) {
        fu.rmTreeSync(path.resolve(rootDir, timestamp));
        done();
    });

    it('should be a Page object', function () {
        thepage.name.should.be.eql(pageName);
        thepage.rootDir.should.eql(rootDir);
        thepage.config.should.be.a('object');
        should.exist(thepage.srcDir);
        should.exist(thepage.destDir);
    });

    it('should create timestamp directory under rootDir', function(done){
        path.exists(path.resolve(rootDir, timestamp), function (exist) {
            exist.should.be.true;
            done();
        });
    });

    it('should create core under timestamp directory', function(done){
        path.exists(path.resolve(rootDir, timestamp, 'core'), function (exist) {
            exist.should.be.true;
            done();
        });
    });

    it('should create concat files list in fb.page.json', function(done){
        fs.readFile(path.resolve(rootDir, timestamp, 'core/concat.js'), 'utf8', function (err, content) {
            if (err) {
                return done(err);
            }
            content.should.include('mods:mod1.js');
            content.should.include('mods:mod2.js');
            done();
        });
    });

    it('should build less', function(done) {
        var buildLessFile = path.resolve(rootDir, timestamp, 'core/lessfile.css');

        fs.readFile(buildLessFile, 'utf8', function(err, data) {
            if (err) {
                return done(err);
            }
            data.should.include('#a.less');
            done();
        });
        
    });

    it('should build kissy', function(done) {
        var buildjsfile = path.resolve(rootDir, timestamp, 'core/index.js');

        fs.readFile(buildjsfile, 'utf8', function(err, data) {
            if (err) {
                return done(err);
            }
            data.should.include("KISSY.add('mods/mod1',");
            data.should.include("KISSY.add('mods/mod2',");
            data.should.include("KISSY.add('core/index',");
            data.should.include("KISSY.add('mods/submod1',");
            //utils
            data.should.include("utils-sample-index.js");
            done();
        });
        
    });

    it('should compress css to -min.css', function(done) {
        var minLessCss = path.resolve(rootDir, timestamp, 'core/lessfile-min.css');
        var minIndexCss = path.resolve(rootDir, timestamp, 'core/index-min.css')

        fs.readFile(minLessCss, 'utf8', function(err, data) {
            if (err) {
                return done(err);
            }
            data.should.include('#a.less');

            fs.readFile(minIndexCss, 'utf8', function(err, data) {
                if (err) {
                    return done(err);
                }
                data.should.include('#a.css');
                data.should.include('#b.css');
                done();
            });
        });
        
    });

    it('should compress js to -min.js', function(done) {
        var minIndexJS = path.resolve(rootDir, timestamp, 'core/index-min.js');
        var minConcatJS = path.resolve(rootDir, timestamp, 'core/concat-min.js');

        fs.readFile(minIndexJS, 'utf8', function (err, data) {
            if (err) {
                return done(err);
            }
            data.should.include('mods:mod1');
            data.should.include('mods:mod2');
            data.should.include('mods:submod1');
            fs.readFile(minConcatJS, 'utf8', function (err, data) {
                if (err) {
                    return done(err);
                }
                data.should.include('mods:mod1');
                data.should.include('mods:mod2');
                data.should.include('mods/submod1');
                done();
            });
        });
    });
});

describe('page add version test', function(){
    var rootDir = path.resolve('sample-project', 'page1');
    var version = '2.0';
    var thepage;

    before(function (done) {
        thepage = new Page({rootDir: rootDir});
        thepage.addVersion(version, done);
    });

    after(function (done) {
        fu.rmTreeSync(path.resolve(rootDir, version));
        done();
    });

    it('should create a fb.page.json. contain standard json', function(done) {
        fu.readJSON(path.resolve(rootDir, version, 'fb.page.json'), function (err, data){
            should.not.exist(err);
            data.should.be.ok;
            done();
        });
    });

    it('should create a fb-build.sh and fb-build.bat file', function(done) {
        fs.readFile(path.resolve(rootDir, version, 'fb-build.sh'), 'utf-8', function (err, shfile){
            if (err) {
                done(err);
            }
            shfile.should.be.ok;
            fs.readFile(path.resolve(rootDir, version, 'fb-build.bat'), 'utf-8', function (err, batfile){
                if (err) {
                    done(err);
                }
                batfile.should.be.ok

                done();
            });
        });
    });

    it('should create all default directories', function(done) {
        var count = 0;
        var dir_count = 0;
        var dirs = ['mods', 'core', 'test'];
        dirs.forEach(function(dir){
            path.exists(path.resolve(rootDir, version, dir), function(exist){
                count ++;

                if (exist) {
                    dir_count++;
                }
                if (count === dirs.length) {
                    dir_count.should.eql(count);
                    done();
                }
            });
        });
    });

    

});


describe('page addVersion test', function(){

    var pageName = 'page1';
    var rootDir = path.resolve('sample-project', pageName);
    var version = '100.002';
    var thepage;

    before(function (done) {
        thepage = new Page({
            rootDir: rootDir,
            name: pageName
        });

        thepage.addVersion(version, done);

    });

    after(function (done) {
        fu.rmTreeSync(path.resolve(rootDir, version));
        done();
    });

    it('should create a fb.page.json in rootDir', function (done) {
        var json_path = path.resolve(rootDir, version, 'fb.page.json');
        fu.readJSON(json_path, function (err, json) {
            if (err) {
                return done(err);
            }
            json.should.be.ok;
            json.should.be.a('object');
            should.exist(json.outputCharset);
            should.exist(json.inputCharset);
            done(null);
        });
    });
});

describe('page#getTimestamps', function () {
    var pageName1 = 'page1';
    var rootDir1 = path.resolve('sample-project', pageName1);
    var page1 = new Page({
        name: pageName1,
        rootDir: rootDir1
    });

    var pageName2 = 'page2';
    var rootDir2 = path.resolve('sample-project', pageName2);
    var page2 = new Page({
        name: pageName2,
        rootDir: rootDir2
    });

    it('should get a blank array with no pub directories', function (done) {
        page1.getTimestamps(function(timestamps) {
            timestamps.length.should.eql(0);
            done();
        });
    });

    it('should get all the pub timestamps', function (done) {
        page2.getTimestamps(function(timestamps) {
            timestamps.should.be.ok;
            timestamps.should.include('20120901')
            timestamps.length.should.eql(3);
            done();
        });
    });

});
