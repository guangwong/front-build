
var fs = require('fs'),
	path = require('path'),
	async = require('asyncjs'),
	findRoot = require('./findRoot');

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
	process.chdir(root);
	path.exists(name, function(exists) {
		if(!exists){
			mkdir(name);
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

exports.add = function(name){
	if (!name) {
		throw new Error('Page Name is Not found.')
	}
	// 找到根目录
	findRoot(function (err, root){
		if(err) throw err;
		process.chdir(root);
		fs.stat(name, function (err) {
			//没有找到，或者是文件
			if(err || stat.isFile()){
				addPage(root, name);
			} 
		})
	});
	// 检查page是否存在
	// 如果存在报错，提示用户先移除目录
	// 如果不存在，创建目录
	// 创建子目录
}