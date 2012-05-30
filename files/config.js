(function () {
    var S = KISSY,
        debug = true;

    window.FB = window.FB || {
        /**
         * Config Kissy 1.2 packages
         * of a FrontBuild Page
         * @param {Object} config
         *  @param pagename
         *  @param version
         *  @param pub 目录时间
         *  @param basepath
         *  @param charset
         *  @param tag
         */
        config: function (config) {
            var pkgs = [],
                packageConfig = {},
                pagePath = S.substitute('{basepath}{page}/{version}/', config),
                //开发或生产环境的开关
                debug = KISSY.Config.debug,
                pagePathBuild = S.substitute('{baspath}/{page}/{pub}/', config);

            //kissy config
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
            S.each(['core', 'mods'], function (name) {
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
})();
