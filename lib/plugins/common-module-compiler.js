var ModuleComplier = require('module-compiler');
var path = require('path');
var _ = require('underscore');

module.exports = function (config) {
    config = config || {};

    config = _.defaults(config, {
        base: ''
    });

    return function (page, next) {
        var packages = [
            {
                name: 'common',
                path: path.join(page.srcDir, config.base),
                charset: page.charset
            }
        ];

        try {
            ModuleComplier.clean();

            ModuleComplier.config({
                packages: packages,
                suffix: '',
                silent: true
            });

            ModuleComplier.build(
                path.resolve(page.srcDir, config.base),
                path.resolve(page.destDir, config.base)
            );

        } catch (e) {
            next(e);
            return;
        }

        next();

    }
};