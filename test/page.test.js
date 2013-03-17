var Page = require('../lib/page');
var App = require('../lib/app');
var should = require('should');
var path = require('path');
var fs = require('fs');
var fu = require('../lib/fileutil');


var clearUtilsDir = function () {
    var utilsDir = path.join('sample-project', 'utils');
    var files = [
        'sample/utils-xtpl.js',
        'sample/utils-tpl.js'
    ];

    files.forEach(function(file){

        file = path.join(utilsDir, file);
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    });
};

describe('Timetamp Test', function(){

    it ('should pass', function () {
        var src = [
            '121212',
            '20121212',

            '121212_dev',
            '20121212_dev',

            '121212_-_',
            '20121212_-_',

            'pub_foo',

            'pub__',

            'pub_-'

        ];
        src.forEach(function(ts){
            Page.testTimestamp(ts).should.eql(true, ts);
        });
    });

    it ('should fail', function () {
        var src = [
            '12121',

            '201212121',

            '121212_',
            '20121212-',

            'pub_',
            'foo_dev',
            'pub_/'
        ];

        src.forEach(function(ts){
            Page.testTimestamp(ts).should.eql(false, ts);
        });
    });
});

describe('Page parser test', function(){
    var src = [
        {
            from: 'page@1.0',
            parsed: {
                name: 'page',
                version: '1.0'
            }
        },
        {
            from: 'page/1.0',
            parsed: {
                name: 'page',
                version: '1.0'
            }
        },
        {
            from: 'page\\1.0',
            parsed: {
                name: 'page',
                version: '1.0'
            }
        },
        {
            from: 'page\\1.0\\',
            parsed: {
                name: 'page',
                version: '1.0'
            }
        },
        {
            from: 'page/1.0/',
            parsed: {
                name: 'page',
                version: '1.0'
            }
        },
        {
            from: '_~-page/1.0',
            parsed: {
                name: '_~-page',
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
                name: 'page',
                version: '3.10000.1'
            }
        },
        {
            from: 'page/1.0',
            parsed: {
                name: 'page',
                version: '1.0'
            }
        },
        {
            from: '_/1.0',
            parsed: {
                name: '_',
                version: '1.0'
            }
        },
        {
            from: 'abcdefghijklmnopqrstuvwxyz/1.0',
            parsed: {
                name: 'abcdefghijklmnopqrstuvwxyz',
                version: '1.0'
            }
        }
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
    var appRoot = 'sample-project';
    var app = new App({
        rootDir: appRoot
    });

    var rootDir = path.join(appRoot, pageName);
    var version = '1.0';
    var timestamp = '20121212';
    var versionDir = path.join(rootDir, version);
    var pubDir = path.join(rootDir, timestamp);
    var page;
    var buildReports;

    before(function (done) {
        app.getConfig(function(err, config){
            if (err) {
                return done(err);
            }


            page = new Page({
                rootDir: rootDir,
                name: pageName,
                app: app,
                version: version
            });
            
            page.build(timestamp, function (err, reports) {
                if (err) {
                    return done(err);
                }

                buildReports = reports;
                done();
            });

        });


    });

    after(function (done) {
        fu.rmTreeSync(path.resolve(rootDir, timestamp));

        fs.unlinkSync(path.join(versionDir, 'page/tpl/foo-tpl.js'));
        fs.unlinkSync(path.join(versionDir, 'page/tpl/foo-xtpl.js'));
        clearUtilsDir();
        done();
    });

    it('should be a Page object', function () {
        page.name.should.be.eql(pageName, 'pageName');
        page.rootDir.should.eql(path.resolve(rootDir), 'rootDir should be resolved');
        page.config.should.be.a('object');
        should.exist(page.srcDir);
        should.exist(page.destDir);
    });

    it('should create timestamp directory under rootDir', function(done){
        path.exists(pubDir, function (exist) {
            exist.should.be.true;
            done();
        });
    });

    it('should create page under timestamp directory', function(done){
        path.exists(path.join(pubDir, 'page'), function (exist) {
            exist.should.be.true;
            done();
        });
    });

    it('should create concat files list in fb.page.json', function(done){
        fs.readFile(path.join(pubDir, 'page/concat.js'), 'utf8', function (err, content) {
            if (err) {
                done(err);
                return;
            }
            content.should.include('mods:mod1.js');
            content.should.include('mods:mod2.js');
            done();
        });
    });

    it('should create concat css files list in fb.page.json', function(done){
        fs.readFile(path.join(pubDir, 'page/concat.css'), 'utf8', function (err, content) {
            if (err) {
                return done(err);
            }
            content.should.include('#a.css');
            content.should.include('#b.css');
            done();
        });
    });

    it('should build less', function(done) {
        var buildLessFile = path.join(pubDir, 'page/lessfile.css');

        fs.readFile(buildLessFile, 'utf8', function(err, data) {
            if (err) {
                return done(err);
            }
            data.should.include('#a.less');
            done();
        });

    });

    it('should build kissy js file', function(done) {
        var buildjsfile = path.join(pubDir, 'page/index.js');

        fs.readFile(buildjsfile, 'utf8', function(err, data) {
            if (err) {
                return done(err);
            }
            data.should.include("KISSY.add('page/mods/mod1',");
            data.should.include("KISSY.add('page/mods/mod2',");
            data.should.include("KISSY.add('page/index',");
            data.should.include("KISSY.add('page/mods/submod1',");
            data.should.include("KISSY.add('page/mods/submod2',");
            data.should.include("KISSY.add('page/tpl/foo-tpl',");
            data.should.include("KISSY.add('utils/sample/index',");

            //外部包
            data.should.include("KISSY.add('package1/mod1',");
            //外部包编码
            data.should.include('外部包模块');

            //utils
            data.should.include("utils-sample-index.js");
            done();
        });
    });

    it('should build xtemplate', function(done){
        var x_tpl_file = path.join(versionDir, 'page/tpl/foo-xtpl.js');
        fs.readFile(x_tpl_file, 'utf8', function(err, cnt){
            if (err) {
                return done(err);
            }
            cnt.should.include('KISSY.add(function(){');
            cnt.should.include('文龙');
            done();
        })
    });

    it('should build kissy template', function(done){
        var x_tpl_file = path.join(versionDir, 'page/tpl/foo-tpl.js');
        fs.readFile(x_tpl_file, 'utf8', function(err, cnt){
            if (err) {
                return done(err);
            }
            cnt.should.include('KISSY.add(function(){');
            cnt.should.include('中文');
            done();
        })
    });

    it('should compress css to -min.css', function(done) {

        var minLessCss = path.join(pubDir, 'page/lessfile-min.css');
        var minIndexCss = path.join(pubDir, 'page/index-min.css')

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

    it('should support gbk utils directory with css-combo', function (done) {
        var minIndexCss = path.join(pubDir, 'page/index-min.css');
        fs.readFile(minIndexCss, 'utf8', function(err, data) {
            if (err) {
                return done(err);
            }
            data.should.include('.gbkmod');
            data.should.include('宋体');
            done();
        });
    });

    it('should compress js to -min.js', function(done) {
        var minIndexJS = path.join(pubDir, 'page/index-min.js');

        fs.readFile(minIndexJS, 'utf8', function (err, data) {
            if (err) {
                return done(err);
            }
            data.should.include('mods:mod1');
            data.should.include('mods:mod2');
            data.should.include('mods:submod1');
            data.should.include('mods:submod2');
            done();
        });
    });

    it('should compress concated js to -min.js', function(done) {

        var minConcatJS = path.join(pubDir, 'page/concat-min.js');

        fs.readFile(minConcatJS, 'utf8', function (err, data) {
            if (err) {
                return done(err);
            }
            data.should.include('mods:mod1');
            data.should.include('mods:mod2');
            done();
        });

    });

    it('should produce reports', function () {
        var pluginsReports = buildReports.plugins;
        var fbReports = buildReports.fb;


        fbReports.should.be.a('object')

        fbReports
            .should.have.property('build_start_time')

        fbReports
            .should.have.property('build_version')
            
        fbReports
            .should.have.property('build_used_time');

        pluginsReports.forEach(function (report) {
            report.should.have.property('name');
            report.should.have.property('used_time');
        });

    });

});

describe('gbk page build test', function () {
    var pageName = 'page1';
    var version = '2.0';
    var timestamp = '000000';
    var buildReports;
    var page;
    var rootDir = 'sample-project';
    var pageRootDir = path.join(rootDir, pageName);
    var app = new App({
        rootDir: rootDir
    });

    var timestampDir = path.join(pageRootDir, timestamp);
    var versionDir = path.join(pageRootDir, version);
    var utilsDir = path.join(rootDir, 'utils');
    var fooTpl = 'page/tpl/foo-tpl.js';
    var fooXTpl = 'page/tpl/foo-xtpl.js';
    var utilsXTpl = 'sample/utils-xtpl.js';
    var utilsTpl = 'sample/utils-tpl.js';

    after(function () {
        fs.unlinkSync(path.join(versionDir, fooTpl));
        fs.unlinkSync(path.join(versionDir, fooXTpl));

        fu.rmTreeSync(path.join(pageRootDir, timestamp));

        clearUtilsDir();
    });

    before(function (done) {
        app.getConfig(function(err, config){
            if (err) {
                return done(err);
            }

            page = app.getPage(pageName, version);
            
            page.build(timestamp, function (err, reports) {
                if (err) {
                    return done(err);
                }

                buildReports = reports;
                done();
            });
        });
    });

    it('should conv the right with css-combo', function (done) {

        fs.readFile(path.join(timestampDir, 'page/index.css'), function (err, buf) {
            var iconv = require('iconv-lite');
            if (err) {
                return done(err);
            }
            var cnt = iconv.decode(buf, 'gbk');
            cnt.should.include('index楷体');
            cnt.should.include('黑体');
            done();
        });
    });

    it('should iconv right with kissy-template', function (done) {
        fs.readFile(path.join(versionDir, fooTpl), function (err, buf) {
            var iconv = require('iconv-lite');
            if (err) {
                return done(err);
            }
            var cnt = iconv.decode(buf, 'gbk');
            cnt.should.include('中文');
            done();
        });
    });

    it('should iconv right with xtemplate', function (done) {
        fs.readFile(path.join(versionDir, fooXTpl), function (err, buf) {
            var iconv = require('iconv-lite');
            if (err) {
                return done(err);
            }
            var cnt = iconv.decode(buf, 'gbk');
            cnt.should.include('文龙');
            done();
        });
    });

    it('should iconv right with xtemplate in utils', function (done) {
        fs.readFile(path.join(utilsDir, utilsXTpl), function (err, buf) {
            var iconv = require('iconv-lite');
            if (err) {
                return done(err);
            }
            var cnt = iconv.decode(buf, 'gbk');
            cnt.should.include('中文xtemplate');
            done();
        });
    });

    it('should iconv right with kissy template in utils', function (done) {
        fs.readFile(path.join(utilsDir, utilsTpl), function (err, buf) {
            var iconv = require('iconv-lite');
            if (err) {
                return done(err);
            }
            var cnt = iconv.decode(buf, 'gbk');
            cnt.should.include('中文template');
            done();
        });
    });

});

describe('page build test with error', function(){
    var pageName = 'page_with_error';

    var app = new App({
        rootDir: path.resolve('sample-project')
    });

    var rootDir = path.resolve('sample-project', pageName);

    var version = '1.0';
    var timestamp = '20121212';
    var tPage;
    var buildReports;

    before(function (done) {
        app.getConfig(function(err, config){
            if (err) {
                return done(err);
            }

            tPage = new Page({
                rootDir: rootDir,
                name: pageName,
                app: app,
                version: version
            });
            done();
        });

    });

    after(function (done) {
        fu.rmTreeSync(path.resolve(rootDir, timestamp));
        fu.rmTreeSync(path.resolve(rootDir, 'page_build_temp'));
        fu.rmTreeSync(path.resolve(rootDir, 'page_src_temp'));
        clearUtilsDir(rootDir);
        done();
    });

    it('should get an error when build page_with_error/1.0', function (done) {

        tPage.build(timestamp, function (err, reports) {
            should.exist(err);
            done();
        });

    });
});

describe('page add version test', function(){
    var rootDir = path.resolve('sample-project', 'page1');
    var version = '10.0';
    var page;

    before(function (done) {
        page = new Page({
            rootDir: rootDir,
            version: version
        });
        page.initVersion(done);
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
                batfile.should.be.ok;

                done();
            });
        });
    });

    it('should create all default directories', function(done) {
        var count = 0;
        var dir_count = 0;
        var dirs = ['page', 'page/mods', 'test'];
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


describe('page initVersion test', function(){

    var pageName = 'page1';
    var rootDir = path.resolve('sample-project', pageName);
    var version = '100.002';
    var thepage;

    before(function (done) {
        thepage = new Page({
            rootDir: rootDir,
            name: pageName,
            version: version
        });

        thepage.initVersion(done);

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

    var pageName2 = 'page_with_timestamp';
    var rootDir2 = path.resolve('sample-project', pageName2);
    var page_with_timestamp = new Page({
        name: pageName2,
        rootDir: rootDir2
    });

    it('should get a blank array with no pub directories', function (done) {
        page1.getTimestamps(function(err, timestamps) {
            should.not.exist(err);
            timestamps.should.be.an.array;
            timestamps.length.should.eql(0);
            done();
        });
    });

    it('should get all the pub timestamps', function (done) {
        page_with_timestamp.getTimestamps(function(err, timestamps) {

            should.not.exist(err);
            timestamps.should.be.ok;
            // timestamps.should.include('20120901')
            timestamps.length.should.eql(3);
            done();
        });
    });

});

describe('page anytics test',function(){
    var appRoot = './sample-project/';
    var pageName = 'page1';
    var version = '1.0';
    var analyzeResult, sampleApp, page;

    before(function(done){
        App.getApp(appRoot, function(err, app){
            if (err) {
                return done(err);
            }
            sampleApp = app;
            page = sampleApp.getPage(pageName, version);

            page.analyze(function (err, result) {
                if (err) {
                    return done(err);
                }
                analyzeResult = result;
                done(null);
            });
        });
    });

    it('should produce a report on modules', function () {
        analyzeResult.should.be.a('object');
        analyzeResult.modules.length.should.eql(3, '3 kissy enter point');
        analyzeResult.modules.forEach(function(m){
//            console.log(m);
//            console.log('----')
        });

    });
});
