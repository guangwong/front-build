/**
 * @fileoverview 项目环境配置，包括包配置等
 * @author 文龙, 剑平（明河）
 */
KISSY.add("fb/env",function(S){
    window.ENV = window.FB = window.FB || {/**@lends ENV*/
        /**
         * 版本
         */
        version: 1.0,
        /**
         * 源码路径模板
         */
        srcPathTpl:"{path}/{name}/{version}/",
        /**
         * 发布路径模板
         */
        pubPathTpl:"{path}/{name}/{pub}/",
        /**
         * 环境定义的包名
         */
        definePkgs:{
            COMMON:'common',
            UTILS:'utils',
            PAGE:'page'
        },
        /**
         * 基于kissy1.2页面的环境配置，主要用于FB工具构建的目录结构
         * @param {Object} config
         *  @param config.name     页面名（会拼入模块js路径中）
         *  @param config.version  源码目录名（fb的目录约定版本号目录即源码目录），也会拼入模块js路径中
         *  @param config.pub      发布目录即模块打包后目录（当页面中引入的kissy-min.js，会去引用该文件夹的模块js，比如apply-min.js）
         *  @param config.path      基路径（模块路径寻址的基点）
         *  @param config.charset 编码
         *  @param config.tag      路径尾部时间戳
         */
        config: function (config) {
            if (!config.path)  config.path = '';
            config.path.replace(/\/$/, '');
            var pkgs = [],
                packageConfig = {},
                pagePath = S.substitute(ENV.srcPathTpl, config),
                pagePathBuild = S.substitute(ENV.pubPathTpl, config);
            //switch dev or production env
            var isDebug = ENV.isDebug();
            //kissy config
            S.each(['charset', 'tag'], function (key) {
                if (config[key]) {
                    packageConfig[key] = config[key];
                }
            });

            //common package
            pkgs.push(S.merge(packageConfig, {
                name: ENV.definePkgs.COMMON,
                path: config.path
            }));

            //utils package is only for dev mode
            if (isDebug) {
                pkgs.push(S.merge(packageConfig, {
                    name: ENV.definePkgs.UTILS,
                    path: config.path
                }));
            }

            //page packages
            pkgs.push(S.merge(packageConfig, {
                name: ENV.definePkgs.PAGE,
                path: isDebug? pagePath : pagePathBuild
            }));

            S.config({
                packages: pkgs
            });
        },
        /**
         * 是否开启了调试
         * @return {Boolean}
         */
        isDebug:function(){
            return S.Config.debug;
        },
        /**
         * 是否是daily环境路径
         * @return {Boolean}
         */
        isDaily : function(){
            return document.domain.indexOf('daily.') > -1;
        },
        /**
         * 获取cdn的路径
         * @return {String} cdn路径（daily或线上）
         */
        getCdn : function(){
            var isDaily = ENV.isDaily();
            return isDaily && 'http://assets.daily.taobao.net' || 'http://a.tbcdn.cn';
        }
    };
    //全局事件中心
    ENV.eventCenter = S.mix({}, S.EventTarget);
    return ENV;
});