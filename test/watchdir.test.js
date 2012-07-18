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
			watcher.on('rename', function (file) {
				console.log('rename: %s', file.filename);
			});

			wather.on('update', function () {
				console.log('update: %s', file.filename);
			});
		});

	});

	after(function (done){
		watcher.stop();
		fu.rmTree(rootDir, done);
	});

	it('should emit rename when file added', function (done) {
		console.log('----add  file filePath');
		watcher.on('rename', function (file) {
			if (rootDir === file.filename) {
				watcher.removeAllListeners('rename');
				done();
			}
		});


		fs.writeFile(filePath, 'hello');

	});

	it('should emit change when file updated', function (done) {
		console.log('----update file filePath');
		watcher.on('change', function (file) {
			if (file.filename == filePath) {
				watcher.removeAllListeners('change');
				done();
			}
		});
		fs.writeFile(filePath, 'hello2');

	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		console.log('----add subDir');
		watcher.on('rename', function (file) {
			console.log('reanme: ', file.filename);
			if (file.filename == rootDir) {
				watcher.removeAllListeners('rename');
				done();
			}
		});
		fs.mkdir(subDir);
	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		console.log('----add subFile.js');
		watcher.on('rename', function (file) {
			console.log('reanme: ', file.filename);
			if (file.filename == subDir) {
				watcher.removeAllListeners('rename');
				done();
			}
		});

		fs.writeFile(subFile, 'subFile.js');
	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		console.log('----update subFile.js');

		watcher.on('change', function (file) {
			console.log('change: ', file.filename);
			if (file.filename == subFile) {
				watcher.removeAllListeners('change');
				done();
			}
		});

		fs.writeFile(subFile, 'subFile.js' + 'update');
	});

});