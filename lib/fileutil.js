var path = require('path'),
    async = require('async'),
    fs = require('fs');

var rmTreeSync = exports.rmTreeSync = function(p){
    p = path.resolve(p);
    if (!path.existsSync(p)) {
        return;
    }

    var files = fs.readdirSync(p);
    console.log('files', files.join(','), files.length);


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

var writeJSON = exports.writeJSONSync = function(filename, obj){
    var jsonText = JSON.stringify(obj, null, 4);
    fs.writeFileSync(path.resolve(filename), jsonText);
};


var readJSON = exports.readJSONSync = function(jsonpath){
    try {
        var jsonText = fs.readFileSync(path.resolve(jsonpath), 'utf-8');
        var json = JSON.parse(jsonText);
    } catch (e) {
        throw e;
    }
    return json;
};