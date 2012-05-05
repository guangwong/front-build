var path = require('path'),
    fs = require('fs'),
    sys = require('util'),
    os = require('os'),
    ModuleComplier = require('tbuild').ModuleComplier;

var less = require('less');

var options = {
    compress: true,
    yuicompress: false,
    optimization: 1,
    silent: false,
    paths: [],
    color: true,
    strictImports: false
}

exports.kissybuild = function(job, callback) {
    ModuleComplier.build(job);
}

exports.lessbuild = function(job, callback){
    fs.readFile(job.target, 'utf-8', function(err, data){
        if(data){
            job.data = data;
        }
        parseLessFile(err, job, callback);
    });
};

var parseLessFile = function (e, job, callback) {

    console.log('parse', job.target, job.output);
    console.log('to', job.target, job.output);

    var output = job.output,
        target = job.target,
        data = job.data,
        fd,css;
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
                    compress: options.compress,
                    yuicompress: options.yuicompress
                });

                if (output) {
                    fd = fs.openSync(output, "w");
                    fs.writeSync(fd, css, 0, "utf8");
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