#!/usr/bin/env node
var fs = require('fs');
var argv = require('optimist')
	.demand(1)
	.usage("$0 init \n$0 add {pagename}")
	.argv;

var FrontBuild = require('../lib/');

switch(argv._[0]) {
	case 'init':
		FrontBuild.init(process.cwd());
		break;
	case 'add':
		FrontBuild.add(argv);
		break;
}