var fs = require('fs'),
	path = require('path');

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
		dirs,
		page = null,
		rootdir = getRootSync(workdir);

	if(!rootdir) {
		return callback(new Error('not a project dir'));
	}

	fs.readFile(path.resolve(rootdir, 'fb.json'), function (err, data) {
		var rel,
			pagename;

		if (err) {
			return callback(err, null);
		}

		try {
			var config = JSON.parse(data.toString());
		} catch (e) {
			return callback(e);
		}

		rel = path.relative(rootdir, workdir);

		if(rel){
			dirs = rel.replace('\\','/').split('/');
			page = {
				name: dirs[0],
				version: dirs.length >=2 ? dirs[1] : null
			}
		}

		return callback(null, {
			dir: rootdir,
			page: page,
			config: config
		});
	});
}