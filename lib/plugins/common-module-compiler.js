var ModuleComplier = require('tbuild').ModuleComplier;
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
                path: path.dirname(page.srcDir),
                charset: page.charset
            }
        ];

        try {
            ModuleComplier.config({
                packages: packages,
                suffix: ''
            });

            ModuleComplier.build(
                path.resolve(page.srcDir, config.base),
                path.resolve(page.destDir, config.base)
            );

        } catch (e) {
            return next(e);
        }

        next();

    }
};