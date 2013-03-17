var fs = require('fs'),
    path = require('path'),
    should = require('should'),
    fu = require('../lib/fileutil'),
    async = require('async'),
    cwd = process.cwd();

describe('fileutil writeJSONSync and readJSON readJSONSync test', function() {
    var obj = {
        xx : [1,2,3],
        yy : {
            xx: Math.random()
        },
        zz : 12345
    };


    var json_file_name = 'test_json_file';

    before(function (){
        if (fs.existsSync(json_file_name)) {
            fs.unlinkSync(json_file_name);
        }
        fu.writeJSONSync(json_file_name, obj);
    });

    after(function (done){
        fs.unlink(json_file_name, done);
    });

    it('should read the json writed to the file', function () {
        var o = fu.readJSONSync(json_file_name);
        o.should.eql(obj);
    });

    it('should read json with async way', function (done){
        var o = fu.readJSON(json_file_name, function (err, o) {
            if (err) {
                return done(err);
            }
            o.should.eql(obj);
            done();
        });
    });
    it('should throw an error if file is not-exist', function (done){
        var o = fu.readJSON('no-json-file', function (err, o) {
            err.should.ok;
            done();
        });
    });
});

describe('fileutil writeJSON and readJSON readJSONSync test', function() {
    var obj = {
        xx : [1,2,3],
        yy : {
            xx: Math.random()
        },
        zz : 12345
    };


    var json_file_name = 'test_json_file';

    before(function(done){
        fs.stat(json_file_name, function (err, stat) {
            if (err) {
                fu.writeJSON(json_file_name, obj, done);
                return;
            }

            if (stat.isFile()) {
                fs.unlink(json_file_name, function (err) {
                    if (err) {
                        return done(err);
                    }

                    fu.writeJSON(json_file_name, obj, done);
                })
            }
        });
        
    });

    after(function(done){
        fs.unlink(json_file_name, done);
    });

    it('should read the json writed to the file', function () {
        var o = fu.readJSONSync(json_file_name);
        o.should.eql(obj);
    });

    it('should read json with async way', function (done){
        var o = fu.readJSON(json_file_name, function (err, o) {
            if (err) {
                return done(err);
            }
            o.should.eql(obj);
            done();
        });
    });
    
    it('should throw an error if file is not-exist', function (done){
        var o = fu.readJSON('no-json-file', function (err, o) {
            err.should.ok;
            done();
        });
    });
});


describe('rmTreeSync Test', function () {
    var root_name = 'test_rmtree_dir';
    var sub1 = path.join(root_name, 'sub1');
    var sub2 = path.join(root_name, 'sub2');
    var subsub1 = path.join(sub1, 'subsub1');
    var subsub2 = path.join(sub1, 'subsub2');
    var paths = [root_name, sub1, sub2, subsub1, subsub2];


    before(function(){
        paths.forEach(function (p) {
            fs.mkdirSync(p);
            fs.writeFileSync(path.resolve(p, 'file1.txt'), 'file1');
            fs.writeFileSync(path.resolve(p, 'file2.txt'), 'file2');
        });
    });

    it('should rm all files created', function(){
        paths.forEach(function (p) {
            fs.existsSync(p).should.be.true;
        });

        fu.rmTreeSync(root_name);

        fs.existsSync(root_name).should.be.false;
    });
});

describe('rmTree Test', function () {
    var root_name = 'test_rmtree_dir';
    var sub1 = path.join(root_name, 'sub1');
    var sub2 = path.join(root_name, 'sub2');
    var subsub1 = path.join(sub1, 'subsub1');
    var subsub2 = path.join(sub1, 'subsub2');
    var paths = [root_name, sub1, sub2, subsub1, subsub2];

    var files = [
        {
            name: 'file1.txt',
            content: 'file1 content'
        },
        {
            name: 'file2.txt',
            content: 'file2 content'
        }
    ];


    before(function(done){
        async.forEachSeries(paths, function (p, callback) {
            fs.mkdir(p, function (err) {
                if (err) {
                    return done(err);
                }
                async.forEach(files, function (fo, callback){
                    fs.writeFile(path.resolve(p, fo.name), fo.content, callback);
                }, callback);
            });
        }, done);
    });

    it('should rm all files created', function(done){


        fu.rmTree(root_name, function (err) {
            if (err) {
                return done(err);
            }
            fs.exists(root_name, function (exist) {
                exist.should.be.false;
                done();
            });
        });

    });
});


describe('fileutil copyTreeSync test', function(){
    var src = path.resolve('files/test_tree');
    var dst = path.resolve('files/copy_of_copyTreeSync');

    after(function(){
        fu.rmTreeSync(dst);
    });

    it('should copy all files from src to dst', function (done) {
        try {
            fu.copyDirSync(src, dst);
        
            //dir eql
            var src_dir = fs.readdirSync(src);
            var dst_dir = fs.readdirSync(dst);
            src_dir.should.eql(dst_dir);

            //sub dir eql
            var src_sub2_dir = fs.readdirSync(path.join(src, 'sub2'));
            var dst_sub2_dir = fs.readdirSync(path.join(dst, 'sub2'));
            src_dir.should.eql(dst_dir);

            //file eql
            var src_file = fs.readFileSync(path.resolve(src, 'sub2/sub22/file221'), 'utf8');
            var dst_file = fs.readFileSync(path.resolve(dst, 'sub2/sub22/file221'), 'utf8');
            dst_file.should.eql(src_file);
        } catch(e) {
            done(e);
            return;
        }
        done(null);
    });
});


describe('test findInDir of fileutil', function(){

    var src = path.resolve('files', 'test_tree');

    it('should find all file match RegExp in directory', function (done) {
        fu.findInDir(src, /.+\.js$/i, function(err, list){
            if (err) {
                return done(err);
            }
            list.length.should.eql(4);
            list.should.include(path.join('sub2', 'find.js'));
            done();
        });
    });

    it('should ignore file in .svn directory', function (done) {
        fu.findInDir(src, /svn[\/\\]file$/i, function(err, list){
            if (err) {
                return done(err);
            }
            list.length.should.eql(0);
            done();
        });
    });

    it('should find all files in directory', function (done) {
        fu.findInDir(src, function(err, list){
            if (err) {
                return done(err);
            }
            list.length.should.eql(9);
            list.should.include(path.join('sub2','sub22', 'find1.js'));
            done();
        });
    });
});

describe('test mkdirp', function() {
    var pathtocreate = './test-mkdirp/path/from/here';

    before(function(done){
        fu.mkdirp(pathtocreate, done);
    });

    after(function(){
        fu.rmTreeSync('./test-mkdirp');
    });

    it('should create the target direcotry witout error', function(done){
        path.exists(pathtocreate, function(exist){
            exist.should.be.true;
            done();
        });
    })
});

describe('test iconv_copy_tree', function(){
    var src = path.resolve('files/test_tree');
    var dst = path.resolve('files/copy_of_test_iconvdir');

    after(function(){
        fu.rmTreeSync(dst);
    });

    it('should conv files from gbk to utf8', function () {
        fu.iconvDir(src, 'gbk', dst, 'utf8');
        var file1 = fs.readFileSync(path.resolve(dst, 'this_is_gbk'), 'utf8');
        var file2 = fs.readFileSync(path.resolve(dst, 'sub1/this_is_gbk'), 'utf8');
        file1.should.include('中文 1');
        file2.should.include('中文 2');
    });
});

describe('test fileutil.iconv', function(){
    var src = './files/test_tree';
    var dst = './files/copy_of_test_iconv';
    before(function(done){
        var minReg = /-min\.\w+$/i;
        fu.iconv({
            from: {
                path: src,
                charset: 'gbk',
                test: /\.txt$/i,
                excludes: [minReg]
            },
            to: {
                path: dst,
                charset: 'utf8'
            }
        }, 
        done);
    });
    after(function(){
        fu.rmTreeSync(dst);
    });

    it('should conv files from gbk to utf8', function () {
        fs.existsSync(path.resolve(dst, 'this_is_gbk')).should.be.false;
        var file2 = fs.readFileSync(path.resolve(dst, 'sub1/iconv.gbk.txt'), 'utf8');
        file2.should.include('中文 2');
    });

    it('should not conv files that match excludes tests', function(){
        var p = path.resolve(dst, 'sub1/iconv.gbk-min.txt');
        fs.existsSync(p).should.be.false;
    });
});

describe('fileutil.getUserHome test', function () {
    var userhome;
    before(function () {
        userhome = fu.getUserHome()
    })
    it('should return a string', function () {
        should.exist(userhome);
        userhome.should.be.a('string');
        userhome.should.be.ok;
    });
    it('should be exist', function (done) {
        fs.exists(userhome, function (exist) {
            exist.should.be.true;
            done();
        });
    });
});