var path = require('path'),
    async = require('async'),
    fs = require('fs'),
    util = require('util');

var listDir = function(){

}

var treeWalk = function(path_name,  callback) {
    path_name = path.resolve(path_name);
    if (!path.existsSync(path_name)) {
        throw new Error('treeWalk: path not exist;');
    }

    readdirSync(path_name);
};

var copyDirSync = function (src_path, target_path) {

    src_path = path.resolve(src_path);
    target_path = path.resolve(target_path);

    if (src_path === target_path) {
        throw new Error('copyDir: src_path is target_path!')
    }

    if (!path.existsSync(src_path)) {
        throw new Error('treeWalk: path not exist;');
    }

    if (!path.existsSync(target_path)) {
        fs.mkdirSync(target_path);
    }


    forEach(readdirSync(src_path), function(p){
        var stat = fs.statSync(p),
            src = path.resolve(src_path, p);
            dst = path.resolve(target_path, p);
            is,
            os;
        if (fs.isDirectory(src)) {
            copyDir(src, dst);
        } else {
            is = fs.createReadStream(p);
            os = fs.createWriteStream(dst);
            util.pump(is, os, cb);
        }
    });
}

var rmTreeSync = exports.rmTreeSync = function(p){
    p = path.resolve(p);
    if (!path.existsSync(p)) {
        return;
    }

    var files = fs.readdirSync(p);

    files.forEach(function(file) {
        var full_p = path.resolve(p, file);
        if (fs.statSync(full_p).isDirectory()) {
            rmTreeSync(full_p);
            return;
        }
        fs.unlinkSync(full_p);
    });

    fs.rmdirSync(p);
};


/**
 * write JSON to a file with pretty print
 * @param  {String} filename file to write
 * @param  {Object} obj      the Javascript Object
 */
var writeJSONSync = exports.writeJSONSync = function(filename, obj){
    var jsonText = JSON.stringify(obj, null, 4);
    fs.writeFileSync(path.resolve(filename), jsonText);
};

/**
 * read json from file
 * @param  {String} jsonpath path of json file
 * @return {Object}          object of json file
 */
var readJSONSync = exports.readJSONSync = function(jsonpath){
    try {
        var jsonText = fs.readFileSync(path.resolve(jsonpath), 'utf-8');
        var json = JSON.parse(jsonText);
    } catch (e) {
        throw e;
    }
    return json;
};

var iconvCopyDir = exports.iconvCopyTree =  function(src_path, from_charset, target_path, to_charset){
    src_path = path.resolve(src_path);
    target_path = path.resolve(target_path);

    from_charset = from_charset || 'utf8';
    to_charset = to_charset || 'utf8';

    if (src_path === target_path) {
        throw new Error('copyDir: src_path is target_path!')
    }

    if (!path.existsSync(src_path)) {
        throw new Error('treeWalk: path not exist;');
    }

    if (!path.existsSync(target_path)) {
        fs.mkdirSync(target_path);
    }


    forEach(readdirSync(src_path), function(p){
        var stat = fs.statSync(p),
            src = path.resolve(src_path, p);
            dst = path.resolve(target_path, p);
            srt,
            destbf = new Buffer();
        if (fs.isDirectory(src)) {
            copyDir(src, dst);
        } else {
            destbf = fs.readSync(fs.open(src, 'r'), srcbf, 0, stat.length, 0);

            if (from_charset != to_charset) {
                srt = iconv.decode(srcbf, from_charset);
                destbf = iconv.encode(srt, to_charset);
            }

            fs.writeSync(fs.openSync(dst, 'w'), destbf, 0, destbf.length, 0);
        }
    });
};