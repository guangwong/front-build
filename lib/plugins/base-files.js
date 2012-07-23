var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var fu = require('../fileutil')

module.exports = function (config) {
    config = _.extend({
        base: 'core'
    }, config);
    
    return function (page, done) {
        var baseSrc = path.resolve(page.srcDir, config.base);

        fs.exists(baseSrc, function (exist) {
            if (!exist) {
                page.baseFiles = [];
                return done(null);
            }
            fu.findInDir(baseSrc, function (err, files) {
                page.baseFiles = files;
                done(null);
            });
        });
    };
};