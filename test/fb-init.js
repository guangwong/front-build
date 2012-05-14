var fs = require('fs'),
    path = require('path'),
    should = require('should'),
    fb = require('../lib'),
    async = require('asyncjs'),
    cwd = process.cwd();

describe('front build init', function (){
    var project = 'tmp_project_dir';


    before(function (done){

        function setupdir(done) {
            fs.mkdir(project, function (err) {
                if(err) {
                    return done(err);
                }
                process.chdir(project);
                project = process.cwd();
                done();
            });
        };

        path.exists(project, function(exists) {
            if(exists) {
                async.rmtree(project, function(err){
                    if(err) return done(err);
                    setupdir(done);
                });
                return;
            }
            setupdir(done);
        });
    });

    after(function (done) {
        process.chdir(cwd);
        done();
    });

    describe('init', function () {
        it('should creat a config file', function (done) {
            //var projectdir = path.join(process.cwd(), project);
            fb.init('./', function(err){
                if(err) return done(err);
                fs.readFile('fb.json', function(err, data){
                    if(err) done(err);
                    try{
                        var config = JSON.parse(data);
                        config.should.be.a('object');
                        path.exists('tools', function(exists){
                            exists.should.be.true;
                            done();
                        });
                        
                    }catch(e){

                        return done(e);
                    }
                });
                
            });
        });
    });
});