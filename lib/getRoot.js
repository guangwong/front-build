var fs = require('fs');
var path = require('path');
var fu = require('./fileutil');
var FrontBuild = require('./frontbuild')

var workdir = '';

function getRootSync(cPath) {
	var currentPath,
		nextPath = cPath,
		stat;

	do {
		currentPath = nextPath;
		try {
			stat = fs.statSync(path.resolve(currentPath,'fb.json'));;

			if (stat && stat.isFile) {
				return currentPath;
			}
		} catch (e) {
			//not found
			//console.log(e);
		}
		nextPath = path.join(currentPath, '..');
	} while (currentPath !== nextPath);
	return null;
}

/**
 * 找到项目根目录
 * @return {Object} an object contain the rootdir , current page name , current version string
 */
module.exports = function (callback) {

	var workdir = process.cwd(),
		page = null,
		rootdir = getRootSync(workdir);

	if(!rootdir) {
		return callback(null);
	}

	try {
		var config = fu.readJSONSync(path.resolve(rootdir, 'fb.json'));
	} catch (e) {
		return callback(e);
	}

	var rel = path.relative(rootdir, workdir);

	

	return callback(null, new FrontBuild({
		dir: rootdir,
		workdir: rel,
		config: config
	}));
}