var path = require('path'),
    fs = require('fs'),
    sys = require('util'),
    os = require('os'),
    ModuleComplier = require('tbuild').ModuleComplier,
    jsp = require('uglify-js').parser,
    pro = require('uglify-js').uglify;

var less = require('less');

var options = {
    yuicompress: false,
    optimization: 1,
    silent: false,
    paths: [],
    color: true,
    strictImports: false
}

exports.kissybuild = function(job, callback) {
    ModuleComplier.build(job);
    callback(null);
}

exports.lessbuild = function(job, callback){
    fs.readFile(job.target, 'utf8', function(err, data){
        if(data){
            job.data = data;
        }
        parseLessFile(err, job, callback);
    });
};

var parseLessFile = function (e, job, callback) {

    var output = job.output,
        output_min = job.output.replace(/\.css$/, '-min.css'),
        target = job.target,
        data = job.data,
        fd,css,css_min;
    if (e) {
        sys.puts("lessc: " + e.message);
        process.exit(1);
    }

    new(less.Parser)({
        paths: [path.dirname(target)],
        optimization: options.optimization,
        filename: target,
        strictImports: options.strictImports
    }).parse(data, function (err, tree) {
        // console.dir(tree);
        if (err) {
            less.writeError(err, options);
            process.exit(1);
        } else {
            try {
                css = tree.toCSS({
                    compress: false
                });

                css_min = tree.toCSS({
                    compress: true,
                    yuicompress: true
                });

                if (output) {
                    fd = fs.openSync(output, "w");
                    fs.writeSync(fd, css, 0, "utf8");
                    fd = fs.openSync(output_min, "w");
                    fs.writeSync(fd, css_min, 0, "utf8");

                } else {
                    sys.print(css);
                }

            } catch (e) {
                less.writeError(e, options);
                process.exit(2);
            }
        }
    });
};

/**
 * ugliy job
 * @param  {Object}   job      the target job
 * @param job.target the target js file
 * @param job.output the output file name
 * @param  {Function} callback function
 */
exports.uglifyjs = function(job, callback){
    //console.log('job', job);

    var jscontent  = fs.readFileSync(job.target, 'utf8'),
        gen_config = {
            ascii_only: true
        },
        ast = jsp.parse(jscontent);

    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);

    var compressed = pro.gen_code(ast, gen_config);
    var fd = fs.openSync(job.output, 'w');
    fs.writeSync(fd, compressed, 0, 'utf8');
    callback(null);
};