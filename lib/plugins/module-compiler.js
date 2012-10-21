var ModuleComplier = require('module-compiler');
var path = require('path');
var _ = require('underscore');

module.exports = function (config) {
    config = config || {};
    
    config = _.defaults(config, {
        base: './'
    });

    return function (page, next) {
        var report = {
            name: 'plugin:module-compiler'
        };
        
        var packages = [
            {
                name: 'page',
                path: page.srcDir,
                charset: page.charset
            },
            {
                name: 'utils',
                path: page.srcDir,
                charset: page.charset
            }
        ];

        function configAndBuild(callback) {
            try {
                ModuleComplier.config({
                    packages: packages,
                    silent: true,
                    suffix: ''
                });
                
                var srcBase = path.resolve(page.srcDir, config.base);
                var buildBase = path.resolve(page.destDir, config.base);

                var reporter = ModuleComplier.build(srcBase, buildBase);
                reporter.name = 'module-compiler';
                if (reporter.files && reporter.files.length) {
                    reporter.files.forEach(function (file) {
                        delete file._moduleCache;
                    });
                }
            } catch (e) {
                return callback(e);
            }
            callback(null, reporter);
        }

        if (page.app) {
            page.app.getConfig(function (err, configs) {
                if (err) {
                    return next(err);
                }
                configAndBuild(next);
            });
        } else {
            configAndBuild(next);
        }

    }
};