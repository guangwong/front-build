var path = require('path');
var async = require('async');
var fs = require('fs');
var iconv = require('iconv-lite');
var util = require('util');
var _ = require('underscore');


var findInDir = exports.findInDir = function(path_name, reg, callback) {
    path_name = path.resolve(path_name);

    function listdir(dir, callback){

        fs.readdir(dir, function(err, list){
            if (err) {
                return callback(err);
            }
            async.map(list, function(p, callback){
                var abs = path.resolve(dir, p);

                fs.stat(abs, function(err, stat){
                    if (err) {
                        return callback(err);
                    }
                    if (stat.isDirectory()) {
                        listdir(abs, callback);
                    } else {
                        callback(null, abs);
                    }
                })
            }, callback);
        });
    }

    path.exists(path_name, function (exist) {
        if(!exist) {
            return callback(new Error('findInDir: path not exist;'));
        }
        listdir(path_name, function(err, list){
            if (err) {
                return callback(err);
            }
            var result = _.chain(list)
                .flatten()
                .map(function(p){
                   return path.relative(path_name, p);
                })
                .filter(function(p){
                    return reg.test(p);
                })
                .value();
            callback(null, result);
        });
    });

    
};

/**
 * copy the entire directory
 * @param  {String} src_path    path of the directory copy from
 * @param  {String} target_path path of the directory to copy to
 * @param  {Object} config      config of copy
 * @return {[type]}             [description]
 */
var copyDirSync = exports.copyDirSync = function (src_path, target_path, config) {

    src_path = path.resolve(src_path);
    target_path = path.resolve(target_path);

    config = config || {};

    if (src_path === target_path) {
        throw new Error('copyDirSync: src_path is target_path!')
    }

    if (!path.existsSync(src_path)) {
        throw new Error('copyDirSync: path not exist;');
    }

    if (!path.existsSync(target_path)) {
        fs.mkdirSync(target_path);
    }


    fs.readdirSync(src_path).forEach(function (p){
        var skip = false;
        if (config.excludes) {
            config.excludes.forEach(function (reg) {
                if (reg instanceof RegExp) {
                    if (!skip && reg.test(p)) {
                        skip = true;
                    }
                } else if (reg instanceof String) {
                    if (!skip && reg.test(p)) {
                        skip = true;
                    }
                }
            });
        }

        if (skip) {
            return;
        }

        var src = path.resolve(src_path, p),
            dst = path.resolve(target_path, p),
            stat = fs.statSync(src);
        if (stat.isDirectory(src)) {
            copyDirSync(src, dst);
        } else {
            fs.writeFileSync(dst, fs.readFileSync(src));
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
 * write JSON to a file with pretty print
 * @param  {String} filename file to write
 * @param  {Object} obj      the Javascript Object
 */
var writeJSON = exports.writeJSON = function(filename, obj, callback){
    filename = path.resolve(filename);
    var dirname = path.dirname(filename);

    if (typeof obj != 'object') {
        return callback(new Error('writeJSON: no object'))
    }

    var jsonText = JSON.stringify(obj, null, 4);

    path.exists(dirname, function (exist) {
        if (!exist) {
            return callback(new Error('writeJSON: path %s not exist', dirname));
        }
        fs.writeFile(filename, jsonText, 'utf8', callback);
    });
};

/**
 * read json from file
 * @param  {String} jsonpath path of json file
 * @return {Object}          object of json file
 */
var readJSON = exports.readJSON = function(jsonpath, callback){
    jsonpath = path.resolve(jsonpath);
    fs.readFile(jsonpath, 'utf8', function (err, text) {
        if (err) {
            return callback(err);
        }
        var json;
        try {
            
            json = JSON.parse(text);
        } catch (e) {
            callback(e);
            return;
        }
        callback(null, json)
    });
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

var iconvDir = exports.iconvDir =  function(src_path, from_charset, target_path, to_charset){
    src_path = path.resolve(src_path);
    target_path = path.resolve(target_path);


    from_charset = from_charset || 'utf8';
    to_charset = to_charset || 'utf8';

    if (src_path === target_path) {
        throw new Error('iconvDir: src_path is target_path!')
    }

    if (!path.existsSync(src_path)) {
        throw new Error('iconvDir: path not exist;');
    }

    if (!path.existsSync(target_path)) {
        fs.mkdirSync(target_path);
    }


    fs.readdirSync(src_path).forEach(function(p){
        var src = path.resolve(src_path, p),
            dst = path.resolve(target_path, p),
            stat = fs.statSync(src),
            srt;


        if (stat.isDirectory(src)) {
            iconvDir(src, from_charset,  dst, to_charset);
        } else {
            var buf = fs.readFileSync(src);

            if (from_charset != to_charset) {
                srt = iconv.decode(buf, from_charset);
                buf = iconv.encode(srt, to_charset);
            }

            fs.writeFileSync(dst, buf);
        }
    });
};