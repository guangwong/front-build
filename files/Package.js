
KISSY.add(function (S) {
    Package = {
        /**
         * Config of Package
         * @param {Object} config
         *  @param page
         *  @param version
         *  @param timestamp
         *  @param tag
         *  @param basepath
         */
        init: function (config) {
            var pkgs = [],
                debug = true,
                pagePath = S.substitute('{baspath}/{name}/{version}/', config),
                packageConfig = {};
                tag = config.tag || '',
                charset = charset || 'gbk',
                pagePathBuild = S.substitute('{baspath}/{name}/{timestamp}/', config);
            if(config.charset) {
                packageConfig.charset = config.charset;
            }
            if(config.charset) {
                packageConfig.charset = config.charset;
            }
            
            //base config
            S.each(['charset', 'tag'], function (key) {
                if (config[key]) {
                    packageConfig[key] = config[key];
                }
            });

            //common package
            pkgs.push(S.merge(packageConfig, {
                name: 'common',
                path: path
            }));

            //page package
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

    window.Package = Package;
});

