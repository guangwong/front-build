var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    getRoot = require('./getRoot'),
    page = require('./page');

exports.init = function (dir, cb) {
    //fb.json
    process.chdir(dir);
    var config = config || {};
    async
        .series([
            function(callback){
                fs.writeFile(path.resolve(dir, 'fb.json'), JSON.stringify(config, null, 4), callback);
            },
            function(callback){
                async.map(['tools','docs'], fs.mkdir, callback);
            }
        ], function(err, results){
            if(err) {
                return fb(err);
            }
            console.log('file "fb.json" created');
            console.log('dir "tools" created');
            console.log('dir "docs" created');
            cb(null);
        });
};