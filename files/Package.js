(function () {
    var S = KISSY,
        debug = true;

    window.Package = {
        /**
         * Config of Package
         * @param {Object} config
         *  @param page
         *  @param version
         *  @param pub
         *  @param tag
         *  @param basepath
         */
        init: function (config) {
            var pkgs = [],
                pagePath = S.substitute('{basepath}{name}/{version}/', config),
                packageConfig = {};
                pagePathBuild = S.substitute('{baspath}/{name}/{pub}/', config);

            //base config
            S.each(['charset', 'tag'], function (key) {
                if (config[key]) {
                    packageConfig[key] = config[key];
                }
            });

            //common package
            pkgs.push(S.merge(packageConfig, {
                name: 'common',
                path: config.basepath
            }));

            //page packages
            S.each(['core','utils', 'mods'], function (name) {
                pkgs.push(S.merge(packageConfig, {
                    name: name,
                    path: debug? pagePath : pagePathBuild
                }));
            });

            S.config({
                packages: pkgs
            });
        }
    };    
})()
