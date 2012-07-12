var ModuleComplier = require('tbuild').ModuleComplier;
var path = require('path');
var _ = require('underscore');

module.exports = function (config) {
    config = config || {};
    
    config = _.defaults(config, {
        base: ''
    });

    return function (page, next) {
        console.log('plugin:module-compiler');
        var packages = [
            {
                name: 'core',
                path: page.srcDir,
                charset: page.charset
            },
            {
                name: 'mods',
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

                ModuleComplier.build(path.resolve(page.srcDir, config.base), path.resolve(page.destDir, config.base));
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