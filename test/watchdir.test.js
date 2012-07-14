var fs = require('fs');
var path = require('path');
var wd = require('../lib/watchdir');
var fu = require('../lib/fileutil');

describe('wd', function () {
	var rootDir = 'dir_watch';

	before(function (done) {
		fs.mkdir(rootDir, done);
	});

	after(function (done){
		fu.rmTree(rootDir, done);
	});

	it('should call when file added', function (done) {
		var watcher = wd(rootDir, {
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

		watcher.on('change', function (ev, filename) {
			console.log('%s:\t$s', ev, filename);
		});
	});
});