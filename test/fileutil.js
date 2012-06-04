var fs = require('fs'),
    path = require('path'),
    should = require('should'),
    fu = require('../lib/fileutil'),
    cwd = process.cwd();

describe('fileutil json test', function() {
    var obj = {
        xx : [1,2,3],
        yy : {
            xx: Math.random()
        },
        zz : 12345
    };


    var json_file_name = 'test_json_file';

    before(function(){
        if (path.existsSync(json_file_name)) {
            fs.unlinkSync(json_file_name);
        }
        fu.writeJSONSync(json_file_name, obj);
    });

    after(function(done){
        fs.unlink(json_file_name, done);
    });

    it('should read the json writed to the file', function () {
        var o = fu.readJSONSync(json_file_name);
        o.should.eql(obj);
    });
});


describe('fileutil rmTree Test', function () {
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
            path.existsSync(p).should.be.true;
        });

        fu.rmTreeSync(root_name);

        path.existsSync(root_name).should.be.false;
    });
});


describe('test icon_copy_tree', function(){
    var src = path.resolve('files/test_iconvdir');
    var dst = path.resolve('files/copy_of_test_iconvdir');

    after(function(){
        fu.rmTreeSync(dst);
    });

    it('should conver files from gbk to utf8', function () {
        console.log('src', src, 'det', dst);
        fu.iconvDir(src, 'gbk', dst, 'utf8');
        var file1 = fs.readFileSync(path.resolve(dst, 'this_is_gbk'), 'utf8');
        var file2 = fs.readFileSync(path.resolve(dst, 'sub1/this_is_gbk'), 'utf8');

        file1.should.eql('中文 1\n');
        file2.should.eql('中文 2\n');
    });
});