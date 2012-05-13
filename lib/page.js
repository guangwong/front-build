var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    getRoot = require('./getRoot'),
    less = require('less'),
    build = require('./build');

/**
 * add a Page to Project
 * @param {String} name name of page.
 * @param {Object} root project root info.
 * @param {String} cb pageName.
 */
exports.add = function(name, root, cb) {

    if (!name) {
        throw new Error('Page Name is Not found.');
    }
    if (!root) {
        throw new Error('NotFbProject');
        return;
    }

    var target = path.resolve(root, name);


    if (!path.exists(target)) {
        console.log('dir %s created', name);
        fs.mkdir(target, cb);
    }else {
        console.log('目录 %s 已存在', name);
        cb();
    }
};

/**
 * add new Version to Project
 * @param  {Object} argv the cli argments.
 * @param  {Object} root project info.
 * @param {Function} cb callback function.
 */
exports.version = function(argv, root, cb) {

    if (!root.page) {
        console.error('不在Page文件夹内！')
        process.exit(3);
    }
    if (argv._.length < 2 || !argv._[1]) {
        console.error("必须指定一个version: fb version {version}")
        process.exit(3);
    }

    if (!/^(\d+\.)+\d+$/.test(argv._[1])) {
        console.error("{version} 格式错误。期望的格式是 [0.]+0;")
        process.exit(3);
    }

    var version = argv._[1],
        page_dir = path.resolve(root.dir, root.page.name);
        
    console.log('add new version [%s] to Page [%s]', version, root.page.name);

    try {
        fs.mkdirSync(path.resolve(page_dir, version));

        ['core', 'mods', 'utils'].forEach(function(name){
            fs.mkdirSync(path.resolve(page_dir, version, name));
        });
    } catch (e) {
        console.error('fail to create directory');
        cb(e);
    }
    cb(null);
};

/**
 * list files in directory by RegExp
 * @param {RegExp} reg extname of file.
 * @param {Array} dir list of files to filter on.
 * @return {Array} files list match.
 */

function filterFile(reg, dir) {

    var list = fs.readdirSync(dir);

    var files = list
        .map(function(file) {
            return path.resolve(dir, file);
        })
        .filter(function(file) {

            if (reg.test(file) && fs.statSync(file).isFile()) {
                return true;
            }

            return false;
        });

    return files;
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
    dirs.reverse().forEach(function(dir) {
        fs.mkdirSync(dir);
    });
}
/**
 * map file name with RegExp
 * @param  {String} file    filename
 * @param  {RegExp} reg     正则表达式.
 * @param  {String} replace 替换.
 * @return {String}         替换后的file path
 */
function fileMap(file, reg, replace) {
    return file.replace(reg, replace);
}


function writeConfig(path, json){
    fs.writeFileSync(path, JSON.stringify(json, null, 2), 'utf-8');
};
/**
 * fb build -v 1.0 -t 20120513
 * @param  {Object} argv parsed argv object.
 * @param  {Object} root root Object.
 */

exports.build = function(root, cb) {
    var page = root.page;
    var rootdir = root.dir;

    if (!page.version) {
        console.log('必须指定打包的版本，示例 -v 1.0');
        process.exit(2);
    }
    if (!page.timestamp) {
        console.log('必须指定打包的时间戳目录, 示例 -t 20120501');
        process.exit(2);
    }

    console.log('building page: %s@%s to %s',
            page.name,
            page.version,
            page.timestamp);

    var page_dir = path.resolve(rootdir, page.name);
    var vertion_dir = path.join(page_dir, page.version);
    var version_core = path.join(vertion_dir, 'core');
    var build_dir = path.join(page_dir, page.timestamp);
    var build_core = path.join(build_dir, 'core');

    if (!path.existsSync(version_core)) {
        console.log('没有找到 core 目录, 打包中止.');
        process.exit(3);
    }

    var files = fs.readdirSync(version_core);

    async.auto({
        //init the build directory
        init: function(done) {

            if (!path.existsSync(build_dir)) {
                mkdirp(path.join(build_dir, 'core'));
                return done(null);
            }
            done(null);
        },
        //parse less files
        less: ['init', function(done) {
            var lessfiles = filterFile(/\.less$/i, version_core),
                jobs = [];
            lessfiles.forEach(function(file) {
                //file.replace(/\.less$/i, '.css')
                var filepath = path.relative(version_core, file),
                    output = fileMap(path.resolve(build_core, filepath), /\.less/i, '.css');
                jobs.push({
                    target: path.resolve(version_core, file),
                    output: output
                });
            });
            async.forEach(
                jobs,
                build.lessbuild,
                done
            );
        }],

        //
        kissybuild: ['init', function(done) {
            build.kissybuild({
                target: 'core',
                base: vertion_dir,
                inputEncoding: 'utf-8',
                outputEncoding: 'utf-8',
                output: build_dir
            }, done);
        }],

        //
        compress: ['kissybuild', function(done) {
            var files = filterFile(/\.combine\.js$/, build_core),
                jobs = [];

            files.forEach(function(file) {
                var from = path.resolve(build_core, file),
                    output = path.resolve(build_core,
                        file.replace(/\.combine\.js$/, '.js'));
                fs.renameSync(from, output);

                jobs.push({
                    target: output,
                    output: output.replace(/\.js$/, '-min.js')
                });
            });

            async.forEach(jobs, build.uglifyjs, done);
        }],

        update: ['compress', function(done){
            writeConfig(path.resolve(build_dir, 'build.json'), {
                pagename: page.name,
                version: page.version,
                buildDate: new(Date)
            });
        }]
    }, function(err) {
        if (err) {
            console.log('build fail');
            process.exit(3);
        }
        console.log('all done!');
    });
};
