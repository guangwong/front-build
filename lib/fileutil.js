var path = require('path'),
    async = require('async'),
    fs = require('fs');

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

var iconvCopyTree = exports.iconvCopyTree =  function(from_path, from_charset, to_path, to_charset){

};