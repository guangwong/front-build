var fs = require('fs'),
    path = require('path'),
    getRoot = require('./getRoot'),
    page = require('./page');

exports.init = function (dir, cb) {
    //fb.json
    dir = path.resolve(dir);

    var config = config || {};

    fs.writeFileSync(path.resolve(dir, 'fb.json'), JSON.stringify(config, null, 4));
    console.log('file "fb.json" created');

    ['tools','docs'].forEach(function(p){
        fs.mkdirSync(path.resolve(dir, p));
    });
    console.log('dir "tools" created');
    console.log('dir "docs" created');

    cb(null);
};