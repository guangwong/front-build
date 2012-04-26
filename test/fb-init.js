var fs = require('fs'),
	path = require('path'),
	should = require('should'),
	fb = require('../lib'),
	async = require('asyncjs');

describe('front build init', function (){
	var project = 'tmp_project_dir';

	beforeEach(function (done){
		function setupdir(done) {
			fs.mkdir(project, done);
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

	describe('init', function () {
		it('should creat a config file', function (done) {
			//var projectdir = path.join(process.cwd(), project);
			process.chdir(project);
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
	})
});