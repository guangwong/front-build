var fs = require('fs'),
	path = require('path'),
	should = require('should'),
	fb = require('../lib'),
	async = require('asyncjs');

var page1 = 'pagesample',
	cwd = process.cwd();

describe('front build init', function (){
	var project = 'tmp_project_dir';


	before(function (done){

		function init(done) {
			fb.init('./', done);
		}

		function setupdir(done) {
			fs.mkdir(project, function (err) {
				if(err) {
					return done(err);
				}
				process.chdir(project);
				project = process.cwd();
				init(done);
			});
		}

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

		it('should creat a page dir in project root', function (done) {
			process.chdir(project);
			fb.add(page1, {
				dir: project
			}, function (err) {
				if (err) {
					return done(err);
				};
				path.exists(path.join(project,page1), function(exists){
					exists.should.be.true;
					done();
				});
			});
		});

		it('not in root direction', function (done) {
			var page2 = 'samplepage2';

			process.chdir(path.join(project, page1));

			fb.add(page2, {
				dir: project
			}, function (err) {
				if(err) {
					return done(err);
				}
				path.exists(path.join(project, page1, page2), function (exists) {
					exists.should.be.false;
					path.exists(path.join(project, page2), function (exists) {
						exists.should.be.true;
						done();
					});
				});
				
			});
		});
	});
});