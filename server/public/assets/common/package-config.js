(function () {
    var S = KISSY;

    window.FB = window.FB || {
        /**
         * Config Kissy 1.2 packages
         * of a FrontBuild Page
         * @param {Object} config
         *  @param name
         *  @param version
         *  @param pub timestamp of published directory
         *  @param path
         *  @param charset
         *  @param tag
         */
        config: function (config) {
            if (!config.path) {
                config.path = '';
            }
            config.path = config.path.replace(/\/$/, '');
            var pkgs = [],
                packageConfig = {},
                pagePath = S.substitute('{path}/{name}/{version}/', config),
                //switch dev or production env
                debug = KISSY.Config.debug,
                pagePathBuild = S.substitute('{path}/{name}/{pub}/', config);
            //kissy config
            S.each(['charset', 'tag'], function (key) {
                if (config[key]) {
                    packageConfig[key] = config[key];
                }
            });

            //common package
            pkgs.push(S.merge(packageConfig, {
                name: 'common',
                path: config.path
            }));

            //utils package is only for dev mode
            if (debug) {
                pkgs.push(S.merge(packageConfig, {
                    name: 'utils',
                    path: config.path
                }));
            }

            //page packages
            pkgs.push(S.merge(packageConfig, {
                name: 'page',
                path: debug? pagePath : pagePathBuild
            }));

            S.config({
                packages: pkgs
            });
        }
    };
})();
