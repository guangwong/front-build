(function () {
    var S = KISSY;

    window.FB = window.FB || {
        /**
         * Config Kissy 1.2 packages
         * of a FrontBuild Page
         * @param {Object} config
         *  @param pagename
         *  @param version
         *  @param pub timestamp of published directory
         *  @param basepath
         *  @param charset
         *  @param tag
         */
        config: function (config) {
            config.basepath = config.basepath.replace(/\/$/, '');
            var pkgs = [],
                packageConfig = {},
                pagePath = S.substitute('{basepath}/{page}/{version}/', config),
                //switch dev or production env
                debug = KISSY.Config.debug,
                pagePathBuild = S.substitute('{basepath}/{page}/{pub}/', config);
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

            //utils package is only for dev mode
            if (debug) {
                pkgs.push(S.merge(packageConfig, {
                    name: 'utils',
                    path: config.basepath
                }));
            }

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
