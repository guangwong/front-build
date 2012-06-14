var ModuleComplier = require('tbuild').ModuleComplier;
var fs = require('fs');
var path = require('path');
var fu = require('../lib/fileutil');
var should = require('should');

describe('tbuild test', function() {
    var rootDir = path.resolve('sample-project');
    var outputDir = path.resolve(rootDir, 'page1/test_tbuild_temp');
    before(function (done) {

        function startBuild() {
            ModuleComplier.build({
                target: '/core/',
                base: [
                    path.resolve(rootDir, 'page1/1.0')
                ],
                debug: true,
                output: outputDir,
                inputEncoding: 'utf8',
                outputEncoding: 'utf8'
            });
        }
        path.exists(outputDir, function(exist) {
            if (exist) {
                startBuild();
                done();
                return;
            }
            fs.mkdir(outputDir, function(err){
                if (err){
                    done(err);
                }

                startBuild();
                done();
            });
        });
    });

    after(function (done) {
        // fu.rmTreeSync(outputDir);
        done();
    });

    it('should build index.js in core ', function (done) {
        fs.readFile(path.resolve(outputDir,'core/index.js'), done);
    });
});