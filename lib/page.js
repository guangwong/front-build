var fs = require('fs'),
    path = require('path'),
    async = require('asyncjs'),
    getRoot = require('./getRoot');

/**
 * add a Page to Project
 * @param {String} name name of page
 * @param {Object} root project root info
 * @param {String} cb pageName
 */
exports.add = function(name, root, cb){

    if (!name) {
        throw new Error('Page Name is Not found.')
    }
    if (!root) {
        throw new Error('NotFbProject');
        return;
    }

    process.chdir(root.dir);

    path.exists(name, function(exists) {
        if(!exists){
            fs.mkdir(name, cb);
        } else {
            console.log('目录 %s 已存在', name);
            cb(new Error("directory exists, can not add page %s", name))
        }
    });
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