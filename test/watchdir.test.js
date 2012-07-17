var fs = require('fs');
var path = require('path');
var watchDir = require('../lib/watchdir');
var fu = require('../lib/fileutil');

describe('watchDir', function () {
	var rootDir = path.resolve('watch_dir_test');
	var filePath = path.resolve(rootDir, 'a.js');

	before(function (done) {
		fs.mkdir(rootDir, done);
	});

	after(function (done){
		fu.rmTree(rootDir, done);
	});

	it('should emit change when file added', function (done) {
		var watcher = watchDir(rootDir, {
			exludes: [
				'.svn',
				'.git'
			],
			includes: [
				'*.js',
				'*.css',
				'*.less'
			]
		});

		watcher.once('change', function(file){
			file.filename.should.eql(filePath);
			done();
			watcher.close();
		});

		watcher.once('init', function () {
			fs.writeFile(filePath, 'hello');
		});

	});
});