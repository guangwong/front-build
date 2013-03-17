var ModuleComplier = require('module-compiler');
var path = require('path');
var _ = require('underscore');

module.exports = function (config) {
    config = config || {};
    
    config = _.defaults(config, {
        base: './'
    });

    return function (page, next) {
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

        if (page.config.plugins && page.config.plugins['module-compiler']) {
            var pluginConfig = page.config.plugins['module-compiler'];
            if (pluginConfig && pluginConfig.packages && pluginConfig.packages.length) {

                pluginConfig.packages.forEach(function(package){
                    package.path = path.resolve(page.rootDir, package.path);
                });

                packages = packages.concat(pluginConfig.packages);
            }
        }

        function configAndBuild(callback) {
            try {
                ModuleComplier.clean();

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
                callback(e);
                return;
            }
            callback(null, reporter);
        }

        if (page.app) {
            page.app.getConfig(function (err, configs) {
                if (err) {
                    next(err);
                    return;
                }
                configAndBuild(next);
            });
        } else {
            configAndBuild(next);
        }

    }
};
