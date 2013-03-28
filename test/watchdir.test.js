var fs = require('fs');
var path = require('path');
var WatchDir = require('../lib/watchdir');
var fu = require('../lib/fileutil');
var should = require('should');

describe('WatchDir', function () {
	var rootDir = path.resolve('watch_dir_test');
	var rootFile = path.resolve(rootDir, 'a.js');
	var subDir = path.resolve(rootDir, 'subDir');
	var subFile = path.resolve(subDir, 'subFile.js');
	var watcher;

	before(function (done) {
        fu.rmTree(rootDir, function(){
            fs.mkdir(rootDir, function (err) {
                if (err) {
                    return done(err);
                }
                watcher = new WatchDir(rootDir);

                watcher.once('init', done);
            });
        });


	});

	after(function (done) {
		watcher.stop();
		fu.rmTree(rootDir, done);
	});

	it('should emit change when file added', function (done) {
		// expectedEvent.push(['rename'])
		watcher.once('change', function () {
			setTimeout(done, 100);
		});
		fs.writeFile(rootFile, 'hello');

	});

	it('should emit change when file updated', function (done) {
		watcher.once('change', function () {
			setTimeout(done, 100);
		});
		fs.writeFile(rootFile, 'hello2');

	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		watcher.once('change', function () {
			setTimeout(done, 100);
		});
		fs.mkdir(subDir);
	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		watcher.once('change', function () {
			setTimeout(done, 100);
		});
		fs.writeFile(subFile, 'subFile.js');
	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		watcher.once('change', function () {
			setTimeout(done, 100);
		});
		fs.writeFile(subFile, 'subFile.js update');
	});

	it('should emit events when subfile removed', function (done) {
		watcher.once('change', function () {
			setTimeout(done, 100);
		});
		fs.unlink(subFile);
	});

});