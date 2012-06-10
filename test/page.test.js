var Page = require('../lib/page');
var should = require('should');
var path = require('path');
var fs = require('fs');
var fu = require('../lib/fileutil');


describe('page build test', function(){
    var rootDir = path.resolve('sample-project', 'page1');
    var version = '1.0';
    var timestamp = '20120505';
    var thepage;

    before(function (done) {
        thepage = new Page({
            rootDir: rootDir
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
        // fu.rmTreeSync(path.resolve(rootDir, timestamp));
        done();
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
});

describe('page add version test', function(){
    var rootDir = path.resolve('sample-project', 'page1');
    var version = '2.0';
    var timestamp = '20120505';
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

    it('should build less', function(done) {
        var buildLessFile = path.resolve(rootDir, timestamp, 'core/index.less.css');

        fs.readFile(buildLessFile, 'utf8', function(err, data) {
            if (err) {
                return done(err);
            }
            data.should.include('#a.less');
            done();
        });
        
    });

    it('should compress css to -min.css', function(done) {
        var minLessCss = path.resolve(rootDir, timestamp, 'core/index.less-min.css');
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
            fs.readFile(minConcatJS, function (err, data) {
                if (err) {
                    return done(err);
                }
                data.should.include('mods:mod1');
                data.should.include('mods:mod2');
                data.should.include('mods:submod1');
                done();
            })
        });
    });

});