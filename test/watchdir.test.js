var fs = require('fs');
var path = require('path');
var watchDir = require('../lib/watchdir');
var fu = require('../lib/fileutil');
var should = require('should');

describe('watchDir', function () {
	var rootDir = path.resolve('watch_dir_test');
	var filePath = path.resolve(rootDir, 'a.js');
	var subDir = path.resolve(rootDir, 'subDir');
	var subFile = path.resolve(subDir, 'subFile.js');
	var watcher;
	var config = {
			exludes: [
				'.svn',
				'.git'
			],
			includes: [
				'*.js',
				'*.css',
				'*.less'
			]
		};

	before(function (done) {
		fs.mkdir(rootDir, function (err) {
			if (err) {
				return done(err);
			}
			watcher = watchDir(rootDir);
			watcher.once('init', done);
		});

	});

	after(function (done){
		watcher.stop();
		fu.rmTree(rootDir, done);
	});

	it('should emit rename when file added', function (done) {
		
		watcher.once('rename', function (file) {
			file.filename.should.eql(rootDir);
			
			done();
		});

		fs.writeFile(filePath, 'hello');

	});

	it('should emit change when file added', function (done) {

		watcher.once('change', function (file) {
			file.filename.should.eql(filePath);
			done();
		});

		fs.writeFile(filePath, 'hello2');

	});

	it('should emit events when direcotory added or file added to subDire', function (done) {

		watcher.once('rename', function (file) {
			file.filename.should.eql(rootDir);
			done();
		});
		fs.mkdir(subDir);
	});

	it('should emit events when direcotory added or file added to subDire', function (done) {

		watcher.once('rename', function (file) {
			file.filename.should.eql(subDir);
			done();
		});

		fs.writeFile(subFile, 'subFile.js');
	});

	it('should emit events when direcotory added or file added to subDire', function (done) {

		watcher.once('change', function (file) {
			file.filename.should.eql(subFile);
			done();
		});

		fs.writeFile(subFile, 'subFile.js' + 'update');
	});

});