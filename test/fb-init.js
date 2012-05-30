var fs = require('fs'),
    path = require('path'),
    should = require('should'),
    fb = require('../lib'),
    fileutil = require('../lib/fileutil'),
    cwd = process.cwd();

describe('front build init', function (){
    var project = path.resolve('./tmp_project_dir');

    before(function (done){
        function setupdir(done) {
            fs.mkdir(project, function (err) {
                if(err) {
                    return done(err);
                }
                done();
            });
        }

        if(path.existsSync(project)) {
        	console.log('exists')
            fileutil.rmTreeSync(project);
            setupdir(done);
            return;
        }

        setupdir(done);	
    });

    after(function() {
    	fileutil.rmTreeSync(project);
    });

    describe('init', function () {
        it('should creat a config file', function (done) {
        	var fb_json_file = path.resolve(project, 'fb.json');

            fb.init(project, function(err){
                if(err) {
                	return done(err);
                }

                fs.readFile(fb_json_file, function(err, data){
                    if (err) {
                    	return done(err);
                    }

                    try{
                        var config = JSON.parse(data);

                        config.should.be.a('object');

                        path.exists('tools', function(exists){
                            exists.should.be.true;
                            done(null);
                        });

                    }catch(e){
                        return done(e);
                    }
                });
                
            });
        });
    });
});