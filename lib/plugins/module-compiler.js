var ModuleComplier = require('tbuild').ModuleComplier;
var path = require('path');

module.exports = function () {

    return function (page, next) {
        var packages = [
            {
                name: 'core',
                path: page.srcDir,
                charset: page.charset,
                suffix: 1
            },
            {
                name: 'mods',
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
                ModuleComplier.build(path.resolve(page.srcDir, 'core'), path.resolve(page.destDir, 'core'));
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
                packages.push({
                    name: 'utils',
                    path: page.app.rootDir,
                    charset: configs.charset || 'utf8'
                });
                configAndBuild(next);
            });
        } else {
            configAndBuild(next);
        }

    }
};