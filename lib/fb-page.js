var _ = require('underscore');
var iconv = require('iconv-lite');
var fs = require('fs');
var path = require('path');
var fu = require('./fileutils');



var Page = module.exports = function() {
    var self = this;
    self.from_dir = cfg.fromDir;
    self.target_dir = cfg.targetDir;
    self.input_charset = cfg.input_charset || 'utf-8';
    self.charset = 'utf-8';
    self.output_charset = cfg.output_charset || 'utf-8';
}

_.extend(Page, {
    TEMP_SOURCE_NAME: 'page_89988123123',
    TEMP_BUILD_DIR: 'page_89988123124'
});
_.extend(Page.prototype, {
    build: function() {
        var self = this;
        // make tempdir
        self.makeTempDir(Page.TEMP_SOURCE_NAME);
        self.makeTempDir(Page.TEMP_BUILD_DIR);
        // change charset to utf-8 and move move to tempdir
        // build
        // change charset to target charset and move to target
        // remove tempdir
    },
    makeTempDir: function(path){
        if (path.exists(path)) {
            fu.rmTreeSync(path);
        }
        fs.makeDirSync(path);
    },
})