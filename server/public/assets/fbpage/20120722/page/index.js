/*
combined files : 

utils/build-page
utils/calendar-init
utils/local-cache
page/mods/reporter
page/template/report-fb-tpl
page/template/report-wrap-tpl
page/template/report-error-wrap-tpl
page/template/report-plugin-tpl
page/template/report-csslint-tpl
page/template/report-files-tpl
page/template/report-concat-tpl
page/template/report-css-combo-tpl
page/template/report-module-compiler-tpl
page/mods/timestamp
page/mods/analyzer
page/template/page-analyze-tpl
page/index

*/
KISSY.add('utils/build-page',function (S) {
    var $ = S.all;

    function PageBuilder () {
        var self = this;
        PageBuilder.superclass.constructor.apply(self, arguments);
    }

    S.extend(PageBuilder, S.Base, /**@lends PageBuilder.prototype */{
        /**
         * build pages to a timestamp
         * @param pages {Array|String} pages to build
         * @param timestamp {String} timestamp build to
         */
        build: function(pages, timestamp) {
            var self = this;
            if (!pages || !pages.length) {
                self.fire(PageBuilder.EV.ERROR, {
                    message: '请指定Page'
                });
                return;
            }

            if (!S.trim(timestamp)) {
                self.fire(PageBuilder.EV.ERROR, {
                    message: '请指定时间戳'
                });
                return;
            }

            if (S.isString(pages)) {
                pages = pages.split(',');
            }

            self.fire(PageBuilder.EV.BUILD, {
                pages: pages,
                timestamp: timestamp
            });

            S.ajax({
                url: self.get('url'),
                data: {
                    timestamp: timestamp,
                    pages: pages.join(','),
                    root: self.get('rootDir')
                },
                cache: false,
                dataType: 'json',
                success: function (data) {

                    if (data.err) {
                        self.fire(PageBuilder.EV.ERROR, {
                            fromBuild: true,
                            error: data.err
                        });
                        return;
                    }

                    self.fire(PageBuilder.EV.SUCCESS, {
                        pages: pages,
                        timestamp: timestamp
                    });

                    if (data.reports) {
                        self.fire(PageBuilder.EV.REPORT, {
                            reports: data.reports
                        });
                    }
                }
            });

        }
    }, /**@lends PageBuilder */{
        EV: {
            GROUP_BUILD: 'group-build',
            ERROR: 'error',
            REPORT: 'report',
            SUCCESS: 'success',
            BUILD_ERROR: 'build-error',
            BUILD: 'build'
        },
        ATTRS : {
            url: {
                value: '/build-pages'
            },
            rootDir: {
                value: ''
            }
        }
    });

    return PageBuilder;
});

KISSY.add('utils/calendar-init',function (S, Calendar, Overlay) {
    var $ = S.all;
    return {
        init: function (config) {

            $(config.triggers).attr('data-cal-trigger', '1');

            var popup = new Overlay.Popup({
                width:192
            });

            popup.render();
            function bodyOnClick (ev) {
                var $et = $(ev.target);
                if(popup.get('el').contains($et)) {
                    return;
                }
                if ($et.attr('data-cal-trigger')) {
                    return;
                }
                if ( $et.parent('.ks-cal-box')) {
                    return;
                }
                popup.hide();
            }

            popup
                .on('hide', function () {
                    $(document.body).detach('click', bodyOnClick);
                })
                .on('show', function () {
                    $(document.body).on('click', bodyOnClick);
                })




            var cal = new Calendar(popup.get('contentEl'));

            cal.on('select', function(e) {
                if (this.targetInput) {
                    $(this.targetInput).val(S.Date.format(e.date, 'yyyymmdd'));
                }

                popup.hide();
            });


            $(config.triggers)
                .on('click', function (ev) {
                    popup.show();
                    var $et = $(ev.target);
                    popup.align($et, ['bl', 'tl']);
                    cal.targetInput = $et;
                    var val = $et.val();
                    if (val) {
                        var m = val.match(/^(\d{2,4})(\d\d)(\d\d)$/);
                        console.log(m);
                        var selectedDate = S.Date.parse(m.slice(1).join('-'));
                        cal.render({
                            date: selectedDate,
                            selected: selectedDate
                        })
                    }
                })

        }
    }
}, {
    requires: ['calendar', 'overlay', 'calendar/assets/base.css']
});
KISSY.add('utils/local-cache',function (S) {
    /**
     * Local Storage
     * @param key
     * @constructor
     */
    function PageCache (key) {
        var self = this;
        self.KEY = key;
    }

    S.augment(PageCache, {
        set: function(k, v) {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            obj[k] = v;
            self.save();
        },

        save: function() {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            localStorage.setItem(KEY, JSON.stringify(obj));
        },

        get: function(k) {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            return obj[k];
        },

        getAll: function() {
            var self = this;
            var KEY = self.KEY;
            if (self._cache) {
                return self._cache;
            }
            var str = localStorage.getItem(KEY);
            if (!str) {
                self._cache = {};
            } else {
                self._cache = JSON.parse(str) || {};
            }
            return self.getAll();
        }
    });

    return PageCache;
});KISSY.add(function (S) {
    /**
     * Local Storage
     * @param key
     * @constructor
     */
    function PageCache (key) {
        var self = this;
        self.KEY = key;
    }

    S.augment(PageCache, {
        set: function(k, v) {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            obj[k] = v;
            self.save();
        },

        save: function() {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            localStorage.setItem(KEY, JSON.stringify(obj));
        },

        get: function(k) {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            return obj[k];
        },

        getAll: function() {
            var self = this;
            var KEY = self.KEY;
            if (self._cache) {
                return self._cache;
            }
            var str = localStorage.getItem(KEY);
            if (!str) {
                self._cache = {};
            } else {
                self._cache = JSON.parse(str) || {};
            }
            return self.getAll();
        }
    });

    return PageCache;
});
//noinspection JSValidateTypes
KISSY.add('page/mods/reporter',function (S, Template,
    fb_tpl,
    wrap_tpl,
    error_wrap_tpl,
    plugin_tpl,
    csslint_tpl, 
    files_tpl, 
    concat_tpl, 
    css_combo_tpl,
    module_compiler_tpl) {
    var $ = S.all;

    var Reporter = function (container) {
        var self = this;
        self.$el = $(container);
        if (!self.$el || !self.$el.length) {
            throw new Error('container is not found');
        }

        S.ready(function() {
            self.init();
        });

    }

    S.extend(Reporter, S.Base, {

        init: function () {
            var self = this;
            $('body').delegate('click', '.report-plugin-item-hd', function (ev) {
                var bd = $(ev.currentTarget).siblings('.report-plugin-item-bd');
                if (bd) {
                    bd.toggle();
                }
            });
        },

        addError: function (err) {
            var self = this;
            var html = Reporter.error_wrap_tpl.render(err);
            self.appendReportEl($(html));
        },

        addReport: function (reports) {
            var self = this;
            var outputs = {};

            S.each(reports, function (report, key) {
                if (self.renderer[key] && report) {
                    outputs[key] = self.renderer[key].call(self, report);
                }
            });

            var html = Reporter.wrap_tpl.render(outputs);

            self.appendReportEl($(html));
        },

        appendReportEl: function (el) {
            el.hide();
            var self = this;
            var reports = self.$el.children();

            if (reports.length > 0) {
                el.insertBefore(reports[0]);
            } else {
                el.appendTo(self.$el);
            }
            el.slideDown(.2);

        },

        pluginRenderer: {
            'csslint': 'csslint_tpl',
            'kissy-template': 'files_tpl',
            'uglifyjs': 'files_tpl',
            'cssmin': 'files_tpl',
            'concat': 'concat_tpl',
            'lesscss': 'files_tpl',
            'css-combo': 'css_combo_tpl',
            'module-compiler': 'module_compiler_tpl',
            'xtemplate': 'files_tpl'
        },

        parserPluginReports: function (reports) {
            console.log(reports);
            return S.map(reports, function (report) {
                switch (report.name) {
                    case 'csslint': 
                        report.count = report.lintReport.length;
                        break;
                    case 'concat':
                    case 'css-combo':
                        report.count = report.jobs.length;
                        break;
                    case 'cssmin':
                    case 'uglifyjs':
                    case 'kissy-template':
                    case 'xtemplate':
                    case 'lesscss':
                    case 'module-compiler':
                        report.count = report.files.length;
                        break;
                }
                return report;
            });
        },

        renderer: {
            fb: function (report) {
                return Reporter.fb_tpl.render(report);
            },

            plugins: function (reports) {
                var self = this;
                var html = [];

                reports = self.parserPluginReports(reports);

                S.each(reports, function (report) {
                    var name = report.name;
                    var tmpl = self.pluginRenderer[name] || null;
                    if (tmpl) {
                        tmpl = Reporter[tmpl];
                    }
                    var content = tmpl ? tmpl.render(report) : '';
                    html.push(Reporter.plugin_tpl.render({
                        name: name,
                        report: report,
                        content: content
                    }));
                });

                return html.join('');
            }
        }

    }, {
        'fb_tpl' : Template(fb_tpl.html),
        'plugin_tpl': Template(plugin_tpl.html),
        'wrap_tpl': Template(wrap_tpl.html),
        'error_wrap_tpl': Template(error_wrap_tpl.html),
        'csslint_tpl': Template(csslint_tpl.html),
        'files_tpl': Template(files_tpl.html),
        'concat_tpl': Template(concat_tpl.html),
        'css_combo_tpl': Template(css_combo_tpl.html),
        'module_compiler_tpl': Template(module_compiler_tpl.html)
    });
    return Reporter;
}, {
    requires: [
        'template',
        '../template/report-fb-tpl',
        '../template/report-wrap-tpl',
        '../template/report-error-wrap-tpl',
        '../template/report-plugin-tpl',
        '../template/report-csslint-tpl',
        '../template/report-files-tpl',
        '../template/report-concat-tpl',
        '../template/report-css-combo-tpl',
        '../template/report-module-compiler-tpl'

    ]
});
/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-fb-tpl',function(){
    return {"html":"<div class=\"report-fb\">\r\n    <span class=\"number\">\r\n        {{build_version}}\r\n    </span>\r\n    <b class='block'></b><b class='triangle'></b>\r\n    <span class=\"number\">\r\n        {{build_timestamp}}\r\n    </span>\r\n    <span class=\"number used-time\">\r\n        {{build_used_time}}ms\r\n    </span>\r\n</div>"};
});

/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-wrap-tpl',function(){
    return {"html":"<div class=\"report\" style='display:none'>\r\n    <div class=\"report-hd\">{{fb}}</div>\r\n    <div class=\"report-bd\">{{plugins}}</div>\r\n</div>"};
});

/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-error-wrap-tpl',function(){
    return {"html":"<div class=\"alert alert-error\">\r\n    <h3> {{message}} </h3>\r\n    <h4>error</h4>\r\n    <pre>{{text}}</pre>\r\n    <h4>stack</h4>\r\n    <pre>{{stack}}</pre>\r\n</div>\r\n"};
});

/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-plugin-tpl',function(){
    return {"html":"<div class=\"report-plugin-item\">\r\n    <div class=\"report-plugin-item-hd{{#if content}} report-plugin-hd-has-content{{/if}}\">\r\n        <h4>{{name}} \r\n        {{#if typeof report.count === 'number'}}\r\n        <span class='plugin-bdg'>\r\n            <span title='Execed' class=\"badge\">{{report.count}}</span>\r\n        </span>\r\n        {{/if}}\r\n        {{#if typeof report.warningCount === 'number' && report.warningCount > 0}}\r\n        <span class='plugin-bdg'>\r\n            <span title='Warning' class=\"badge badge-warning\">{{report.warningCount}}</span>\r\n        </span>\r\n        {{/if}}\r\n        {{#if typeof report.errorCount === 'number' && report.errorCount > 0}}\r\n        <span class='plugin-bdg'>\r\n            <span title='Error'  class=\"badge badge-important\">{{report.errorCount}}</span>\r\n        </span>\r\n        {{/if}}\r\n        </h4>\r\n    </div>\r\n    {{#if content}}\r\n    <div class='report-plugin-item-bd'>{{content}}</div>\r\n    {{/if}}\r\n    <div class=\"report-plugin-item-ft\">\r\n        <ul>\r\n            <li class='used-time'><i class='icon-time'></i> {{report.used_time}} ms\r\n            </li>\r\n        </ul>\r\n    </div>\r\n</div>"};
});

/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-csslint-tpl',function(){
    return {"html":"<div class=\"csslint-list\">\r\n    {{#if lintReport&&lintReport.length}}\r\n        {{#each lintReport as item}}\r\n            <div class='csslint-list-item'>\r\n                <h4 class='csslint-file'>{{item.file}}</h4>\r\n                <!-- <p>{{item.fullpath}}</p> -->\r\n                <pre>{{item.output}}</pre>\r\n            </div>\r\n        {{/each}}\r\n    {{#else}}\r\n        没有CSS文件\r\n    {{/if}}\r\n</div>\r\n"};
});

/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-files-tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\r\n{{#if !files.length}}\r\n    <div>\r\n        没有文件\r\n    </div>\r\n{{#else}}\r\n    <ul class=\"plugin-file-list\">\r\n        {{#each files as file}}\r\n            <li>\r\n                <i class=\"icon-file\"></i> {{file}}\r\n            </li>\r\n        {{/each}}\r\n    </ul>\r\n{{/if}}\r\n"};
});

/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-concat-tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\r\n{{#if !jobs.length}}\r\n    <div>\r\n        没有文件\r\n    </div>\r\n{{#else}}\r\n    <ul >\r\n        {{#each jobs as job}}\r\n            <li>\r\n                <h4><i class=\"icon-file\"></i> {{job.filename}}</h4>\r\n                <ul class=\"plugin-file-list\">\r\n                    {{#each job.files as file}}\r\n                        <li title='{{file.path}}'>{{file.filename}}</li>\r\n                    {{/each}}\r\n                </ul>\r\n            </li>\r\n        {{/each}}\r\n    </ul>\r\n{{/if}}\r\n"};
});

/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-css-combo-tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\r\n{{#if !jobs.length}}\r\n    <div>\r\n        没有文件\r\n    </div>\r\n{{#else}}\r\n    <ul class=\"plugin-file-list\">\r\n        {{#each jobs as job}}\r\n            <li>\r\n                <h5><i class=\"icon-file\"></i> {{job.filename}} </h5>\r\n                <ul class=\"plugin-file-list\">\r\n                    {{#each job.imports as file}}\r\n                        <li>\r\n                            <i class=\"icon-bookmark\"></i>  \r\n                            {{file}}\r\n                        </li>\r\n                    {{/each}}\r\n                </ul>\r\n            </li>\r\n        {{/each}}\r\n    </ul>\r\n{{/if}}\r\n"};
});

/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/report-module-compiler-tpl',function(){
    return {"html":"<h4>Module Compiler:</h4>\r\n{{#if !files.length}}\r\n    <div>\r\n        没有找到Kissy模块\r\n    </div>\r\n{{#else}}\r\n    <ul class=\"plugin-file-list\">\r\n        {{#each files as file}}\r\n            <li>\r\n                <h5 class=\"ks-module status-{{file.status}}\">\r\n                    <strong title='{{file.path}}'>{{file.name}}</strong>\r\n                    <span>{{file.status}}</span>\r\n                    {{#if file.status !== 'ok'}}\r\n                        <span class=\"status\">[{{file.status}}]</span>\r\n                    {{/if}}\r\n                </h5>\r\n                {{#if file.submods.length}}\r\n                    <ul class=\"submods\">\r\n                        {{#each file.submods as mod}}\r\n                        <li class='status-{{mod.status}}'>\r\n                            <strong title='{{mod.path}}'>{{mod.name}}</strong>\r\n                            {{#if mod.status !== 'ok'}}\r\n                            <span class=\"status\">[{{mod.status}}]</span>\r\n                            {{/if}}\r\n                        </li>\r\n                        {{/each}}\r\n                    </ul>\r\n                {{#else}}\r\n                    \r\n                {{/if}}\r\n            </li>\r\n        {{/each}}\r\n    </ul>\r\n{{/if}}"};
});

KISSY.add('page/mods/timestamp',function (S) {

    var $ = S.all;

    S.ready(function () {
        $('body').delegate('click', '.build-timestamp', function (ev) {
            var $et = $(ev.target);
            var $input = $('.timestamp-input');
            var $clone = $et.clone(true);
            var offsetFrom = $et.offset();
            var offsetTo = $input.offset();
            $clone.appendTo('body');
            $clone
                .css('position', 'absolute')
                .css('left', offsetFrom.left)
                .css('top', offsetFrom.top)
                .show()
                .animate({
                    'left': offsetTo.left,
                    'top': offsetTo.top
                }, .2, 'easeNone', function () {
                    $input.val($et.html());
                    setTimeout(function () {
                        $clone.remove();
                    }, 0);
                });
        })
    })
});
/**
 * @fileOverview analyze for page
 * @author qipbbn
 */
KISSY.add('page/mods/analyzer',function (S, Template, tpl) {
    var $ = S.all;

    /**
     *
     * @param config
     * @param config.rootDir
     * @param config.pageVersion
     * @constructor
     */
    function Analyzer(config) {
        var self = this;
        Analyzer.superclass.constructor.apply(self, arguments);
        self.tpl =  new Template(tpl.html);
    }

    S.extend(Analyzer, S.Base, {
        /**
         * analyze a page
         * @return {Promise}
         */
        analyze: function () {
            var self = this;
            var def = new S.Defer();
            S.io({
                url: '/analyze-page/' + self.get('pageVersion'),
                data: {
                    root: self.get('rootDir')
                },
                dataType: 'json',
                success: function (data) {
                    def.resolve({
                        html: self.tpl.render(data)
                    });
                },
                error: function () {
                    def.reject('net work error');
                }
            });
            return def.promise;
        }
    });

    return Analyzer;
}, {
    requires: ['template', '../template/page-analyze-tpl']
});
/**
  Template Module Generated by KissyPie 
 **/
KISSY.add('page/template/page-analyze-tpl',function(){
    return {"html":"<div class=\"report\">\r\n    <div class=\"report-hd\">\r\n        模块依赖分析\r\n    </div>\r\n    <div class=\"report-bd\">\r\n        <div class=\"analyze-report\">\r\n            {{#if modules.length}}\r\n                <table class='table'>\r\n                    <thead>\r\n                    <tr>\r\n                        <th>入口模块</th>\r\n                        <th>子模块</th>\r\n                    </tr>\r\n                    </thead>\r\n                    <tbody>\r\n                    {{#each modules as mod}}\r\n                    <tr>\r\n                        <td><a target='hiddenIframe' href=\"/openfile?path={{mod.file}}\">{{mod.name}}</a></td>\r\n                        <td>\r\n                            {{#if mod.mods.length}}\r\n                            <ul>\r\n                                {{#each mod.mods as submod}}\r\n                                {{#if submod.status === 'ok'}}\r\n                                <li class=\"status-ok\"><a target='hiddenIframe' href=\"/openfile?path={{submod.file}}\">{{submod.name}}</a></li>\r\n                                {{#else}}\r\n\r\n                                <li class=\"status-warning\">{{submod.name}} <span class=\"label label-warning\">{{submod.status}}</span></li>\r\n                                {{/if}}\r\n\r\n                                {{/each}}\r\n                            </ul>\r\n                            {{#else}}\r\n                            没有子模块\r\n                            {{/if}}\r\n                        </td>\r\n                    </tr>\r\n                    {{/each}}\r\n\r\n                    </tbody>\r\n                </table>\r\n            {{#else}}\r\n                没有找到入口模块\r\n            {{/if}}\r\n        </div>\r\n    </div>\r\n</div>\r\n"};
});

KISSY.add('page/index',function (S, PageBuilder, Calendar, LocalCache, Reporter, Timestamp, Analyzer) {
    var $ = S.all;

    function initAnalyze(config, reporter) {
        var analyzer = new Analyzer(config);
        $('#analyze-modules').on('click', function(){
            analyzer.analyze().then(function (data) {
                reporter.appendReportEl($(data.html));
            });
        });
    }

    function initBuilder(config, pageCache, reporter) {
        var pb = new PageBuilder({
            rootDir: config.rootDir
        });

        var btn =  $('#fb-build-page');
        var timestamp =  $('#fb-build-timestamp');
        var $status = $('#fb-build-status');

        timestamp.val(pageCache.get('timestamp'));

        btn.on('click', function(ev) {
            ev.preventDefault();
            $status.html('building...');
            pb.build(config.pageVersion, timestamp.val());
        });

        pb
            .on('build', function (ev) {
                pageCache.set('timestamp', ev.timestamp);
            })
            .on('success', function (ev) {
                $status.html('success!').show();
                setTimeout(function () {
                    $status.hide();
                }, 2000);
            })
            .on('error', function (ev) {
                if (ev.fromBuild) {
                    reporter.addError(ev.error);
                    $status.html("打包失败！ ").show();
                    return;
                }
                $status.html("error: " + ev.error.message).show();
            })
            .on('report', function (ev) {

                S.each(ev.reports, function (report) {
                    reporter.addReport(report);
                });

            });
        return pb;
    }

    /**
     * Page init script
     * @param config obj of config
     * @param config.rootDir App Root
     * @param config.pageVersion App Root
     */
    function init (config) {

        S.ready(function () {
            var pageCache = new LocalCache('page-cache:' + config.rootDir +  '/' +  config.pageVersion);
            var reporter = new Reporter('#reports');

            initBuilder(config, pageCache, reporter);


            initAnalyze(config, reporter);

            Calendar.init({
                triggers: 'input.timestamp-input'
            });



        });
    }

    return {
        init: init
    };
}, {
    requires: [
        'utils/build-page',
        'utils/calendar-init',
        'utils/local-cache',
        './mods/reporter',
        './mods/timestamp',
        './mods/analyzer']
});

