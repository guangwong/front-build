var fs = require('fs');
/**
 * 找到项目根目录
 * @return {[type]} [description]
 */
var findRoot = module.exports = function (cb) {
	fs.stat('./fb.json', function(err, stat) {
		var cwd = process.cwd();
		if (err) {
			return cb(err);
		}

		if (!stat || !stat.isFile()) {
			try {
				process.chdir('..');
				if (cwd === process.cwd()) {
					//到根目录了
					cb(null, null);
					return;
				}
				readConfig();
			} catch(e) {

			}
			return;
		}

		fs.readFile('./fb.json', function (err, data) {
			try {
				var config = JSON.parse(data.toString());
				cb(err, {
					"root": cwd,
					"config": config
				});
			} catch (e) {
				cb(err);
			}
			
		});

	});
}