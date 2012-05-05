var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    getRoot = require('./getRoot'),
    less    = require('less'),
    build   = require('./build');

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

    var target = path.resolve(root, name);


    if ( !path.exists(target) ) {
        console.log("dir %s created", name);
        fs.mkdir(target, cb);
    }else {
        console.log('目录 %s 已存在', name);
        cb();
    }
};

/**
 * add new Version to Project
 * @param  {Object} argv the cli argments   
 * @param  {Object} root project info
 */
exports.version = function (argv, root, cb) {

    if (!root.page) {
        console.log('Please use this command in a page directory.');
        throw new Error('Not a page ')
    }

    var version = argv._[1],
        target = path.resolve(root.dir, root.page, version);
    
    fs.mkdir(target, cb);
};

/**
 * filterFileByType
 * @param {string} type extname of file
 * @param {Array} files list of files to filter on
 * @return {Array} files list match
 */

function filterFile(type, files, coredir) {
    return files.filter(function(file){
        if (path.extname(file).toLowerCase() !== type) {
            return false;
        }
        var fullpath = path.resolve(coredir, file);

        if (fs.statSync(fullpath).isFile()) {
            return true;
        }

        return false;
    });
}

function mkdirp(abspath) {
    // console.log('[mkdirp]', abspath);
    var dirs = [];
    while (!path.existsSync(abspath)) {
        // console.log('abspath %s not exists', abspath);
        dirs.push(abspath);
        abspath = path.join(abspath, '..');
        // console.log('upto %s', abspath)
    }
    // console.log('[mkdirp]', dirs);
    dirs.reverse().forEach(function(dir){
        fs.mkdirSync(dir);
    });
}

/**
 * fb build -v 1.0 -t 20120513
 * @param  {[type]} argv [description]
 * @param  {[type]} root [description]
 * @return {[type]}      [description]
 */
exports.build = function (argv, root, cb) {
    //console.log(argv.v, argv.t, root);
    var version  = argv.v,
        timestamp = argv.t,
        rootdir = root.dir,
        pageName = root.page;
    var srcdir = path.join(rootdir,pageName, version);
    var coredir = path.join(srcdir,'core');
    var builddir = path.join(rootdir, pageName, timestamp);

    if(!path.existsSync(coredir)) {
        return cb(new Error('No Core Dir found in src dir'));
    }

    var files = fs.readdirSync(coredir);

    async.auto({
        //less
        init : function (done) {
            // console.log('[checkexist]', builddir);
            if(!path.existsSync(builddir)) {
                
                mkdirp(path.join(builddir, 'core'));
                return done(null);
            }
            done(null);
            
        },

        less: ['init', function (done) {
            var lessfiles = filterFile('.less', files, coredir),
                jobs = [];
            lessfiles.forEach(function (file) {
                jobs.push({
                    target: path.resolve(coredir, file),
                    output: path.resolve(builddir, 'core', file.replace(/\.less$/i, '.css'))
                });
            });
            async.forEach(
                jobs,
                build.lessbuild,
                function(err, fullpaths){
                    cb(null);
                }
            );
        }],
        js : ['init', function (done){
            build.kissybuild({
                target: 'core',
                base: srcdir,
                inputEncoding: 'utf-8',
                outputEncoding: 'utf-8',
                output: builddir
            }, done);
        }]
    }, cb);
};