var fs = require('fs');
/**
 * 找到项目根目录
 * @return {[type]} [description]
 */
var getRoot = module.exports = function (callback) {
	fs.stat('./fb.json', function(err, stat) {
		var cwd = process.cwd();

		if (err || !stat || !stat.isFile()) {
			try {
				process.chdir('..');
				if (cwd === process.cwd()) {
					//到根目录了
					return callback(null, null);
				}
			} catch(e) {
				return getRoot(callback);
			}
		}

		fs.readFile('./fb.json', function (err, data) {

			if (err) {
				return callback(null, null);
			}

			try {
				var config = JSON.parse(data.toString());
			} catch (e) {
				return callback(e);
			}

			return callback(err, {
				dir: cwd,
				config: config
			});
		});

	});
}