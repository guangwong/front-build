var fs = require('fs'),
    path = require('path'),
    async = require('asyncjs'),
    getRoot = require('./getRoot'),
    page = require('./page');

exports.init = function (dir, cb) {
    //fb.json
    process.chdir(dir);
    var config = config || {};
    async.files(['fb.json'])
        .writeFile(JSON.stringify(config, null, 4))
        .end(function(err){
            if(err) return cb(err);
            async
                .files(['tools','docs'])
                .mkdir()
                .end(function (err) {
                    page.add('common', {
                        dir: process.cwd()
                    }, cb);
                });
        });
};