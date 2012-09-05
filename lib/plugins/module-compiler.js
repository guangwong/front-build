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
                    suffix: ''
                });
                var srcBase = path.resolve(page.srcDir, config.base);
                var buildBase = path.resolve(page.destDir, config.base);

                ModuleComplier.build(srcBase, buildBase);
            } catch (e) {
                return callback(e);
            }

            callback();
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