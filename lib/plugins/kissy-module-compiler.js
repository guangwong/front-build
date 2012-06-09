var ModuleComplier = require('tbuild').ModuleComplier;

module.exports = function (config) {
    return function (page, next) {
        console.log('plgin: ModuleComplier');
        ModuleComplier.build({
            target:'core',
            base: page.temp_src_dir,
            inputEncoding: page.charset,
            outputEncoding: page.charset,
            output: page.temp_build_dir
        });
        next();
    }
}