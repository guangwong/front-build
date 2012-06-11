var ModuleComplier = require('tbuild').ModuleComplier;

module.exports = function (config) {

    return function (page, next) {
        console.log('plgin: ModuleComplier');

        ModuleComplier.build({
            target:'core',
            base: page.srcDir,
            inputEncoding: page.charset,
            outputEncoding: page.charset,
            output: page.destDir
        });
        next(null);
    }
};