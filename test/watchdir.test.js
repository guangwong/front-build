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
	var eventList = [];
	var expectedEvent = [];
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
			watcher = new WatchDir(rootDir);

			watcher.on('change', function (ev) {
				eventList.push(['change',ev.path]);
			});

			watcher.on('rename', function (ev) {
				eventList.push(['rename',ev.path]);
			});

			watcher.once('init', done);
		});

	});

	after(function (done){
		watcher.stop();
		console.log('eventList:')

		var out = eventList.map(function (ev) {
			return ev.join(': ');
		}).join('\n');

		var eventTypes = eventList.map(function (ev) {
			return ev[0];
		});

		var expectedTypes = expectedEvent.map(function (ev) {
			return ev[0];
		});
		eventTypes.should.eql(expectedTypes);

		console.log(out);
		fu.rmTree(rootDir, done);
	});

	it('should emit rename when file added', function (done) {
		expectedEvent.push(['rename'])
		fs.writeFile(rootFile, 'hello');
		setTimeout(done, 200);

	});

	it('should emit change when file updated', function (done) {
		expectedEvent.push(['change'])
		fs.writeFile(rootFile, 'hello2');
		setTimeout(done, 200);

	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		expectedEvent.push(['rename'])
		fs.mkdir(subDir);
		setTimeout(done, 200);
	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		expectedEvent.push(['rename']);
		fs.writeFile(subFile, 'subFile.js');
		setTimeout(done, 200);
	});

	it('should emit events when direcotory added or file added to subDire', function (done) {
		expectedEvent.push(['change']);
		fs.writeFile(subFile, 'subFile.js update');
		setTimeout(done, 200);
	});

	it('should emit events when subfile removed', function (done) {
		expectedEvent.push(['rename']);
		fs.unlink(subFile);
		setTimeout(done, 200);
	});

});