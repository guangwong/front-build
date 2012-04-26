#!/usr/bin/env node
var fs = require('fs'),
	argv = require('optimist')
		.demand(1)
		.usage("$0 init \n$0 add {pagename}")
		.argv,
	cwd = process.cwd(),
	FrontBuild = require('../lib/'),
	getRoot = require('../lib/getRoot');

getRoot(function (err, root) {
	process.chdir(cwd);
	if (err) {
		console.log(err);
		process.exit(1);
	}

	if (argv._[0] === 'init' && root) {
		console.log('已经是一个工作目录了');
		process.exit(2);
	}

	switch(argv._[0]) {
		case 'init':
			FrontBuild.init(cwd, function(err, doc){
				console.log('初始化完毕');
				process.exit(0);
			});
			break;
		case 'add':
			FrontBuild.add(argv, root);
			break;
		case 'version':
			FrontBuild.version(argv, root);
			break;
	}
});
