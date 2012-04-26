
var fs = require('fs'),
	path = require('path'),
	async = require('asyncjs'),
	getRoot = require('./getRoot');

module.exports.init = function (dir, cb) {
	//fb.json
	process.chdir(dir);
	var config = config || {};
	async.files(['fb.json'])
		.writeFile(JSON.stringify(config, null, 4))
		.end(function(err){
			if(err) return cb(err);
			async
				.files(['tools','docs'])
				.mkdir()
				.end(cb);
		})
		
}

/**
 * 创建新的Page
 * @param  {String} root Project root dir
 * @param  {String} name PageName
 * @return {null}      null
 */
function addPage (root, name) {
	process.chdir(root.dir);
	path.exists(name, function(exists) {
		if(!exists){
			fs.mkdir(name);
		} else {
			console.log('目录%s已存在', name);
		}
	})
	fs.mkdir(name, function(err){
		if(err) {
			throw new Error;
		}
		console.log('Page %s 创建成功', name);
	});
}
/**
 * add a Page to Project
 * @param {argv} name cli argments
 * @param {Object} project info
 */
exports.add = function(argv, root){
	var name = argv._[1];

	if (!name) {
		throw new Error('Page Name is Not found.')
	}
	if (!root) {
		throw new Error('NotFbProject');
		return;
	}

	process.chdir(root.dir);

	fs.stat(name, function (err) {
		//没有找到，或者是文件
		if(err || stat.isFile()){
			addPage(root, name);
		}
	})
	// 检查page是否存在
	// 如果存在报错，提示用户先移除目录
	// 如果不存在，创建目录
	// 创建子目录
};

/**
 * add new Version to Project
 * @param  {Object} argv the cli argments	
 * @param  {Object} root project info
 */
exports.version = function (argv, root) {
	var version = argv._[1];
	if (!root.page) {
		console.log('Please use this command in a page directory.');
		throw new Error('Not a page ')
	}

	process.chdir(root.dir);

	fs.stat(name, function (err) {
		if(err || stat.isFile()){
			addPage(root, name);
		} 
	});
}