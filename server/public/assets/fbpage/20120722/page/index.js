/*
combined files : 

utils/build-page
utils/calendar-init
page/mods/reporter
page/template/report-fb-tpl
page/template/report-wrap-tpl
page/template/report-error-wrap-tpl
page/template/report-plugin-tpl
page/template/report-csslint-tpl
page/template/report-files-tpl
page/template/report-concat-tpl
page/template/report-css-combo-tpl
page/mods/timestamp
page/index

*/
KISSY.add('utils/build-page',function (S) {
    var $ = S.all;

    function PageBuilder () {
        var $buildbtn = $('.fb-build-page');
        var self = this;
        $buildbtn.on('click', function (ev) {
            ev.preventDefault();
            var $btn = $(ev.target);
            var $elStatus = $btn.siblings('.status');
            var $input = $btn.siblings('input');
            $elStatus.html('building...');
            var timestamp = $input.val();

            S.ajax({
                url: $btn.attr('href'),
                data: {
                    timestamp: timestamp
                },
                dataType: 'json',
                success: function (data) {

                    if (data.err) {
                        var err = data.err;
                        $elStatus
                            .html('Error:' + err.message);
                        self.fire('error', {
                            error: data.err
                        });
                        return;
                    }

                    $elStatus.html('success!');

                    setTimeout(function () {
                        $elStatus.html('')
                    }, 2000);

                    if (data.reports) {
                        self.fire('report', {
                            reports: data.reports
                        });
                    }
                }
            });
        });
    }

    S.extend(PageBuilder, S.Base);

    return new PageBuilder();
});KISSY.add('utils/calendar-init',function (S, Calendar, Overlay) {
    var $ = S.all;
    return {
        init: function (config) {
            var hideTimeout;

            var popup = new Overlay.Popup({
                width:192
            });

            popup.render();

            var cal = new Calendar(popup.get('contentEl'));

            cal.on('select', function(e) {
                if (this.targetInput) {
                    $(this.targetInput).val(S.Date.format(e.date, 'yyyymmdd'));
                }
                popup.hide();
            });

            $(config.triggers)
                .on('click', function (ev) {
                    clearTimeout(hideTimeout);
                    popup.show();
                    var et = $(ev.target);
                    popup.align(et, ['bl', 'tl']);
                    cal.targetInput = et;
                })
                .on('blur', function (ev) {
                    hideTimeout = setTimeout(function () {
                        popup.hide();
                    }, 300);
                });
        }
    }
}, {
    requires: ['calendar', 'overlay', 'calendar/assets/base.css']
});KISSY.add('page/mods/reporter',function (S, Template, fb_tpl, wrap_tpl, error_wrap_tpl, plugin_tpl, csslint_tpl, files_tpl, concat_tpl, css_combo_tpl) {
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
            })
        },

        addError: function (error) {
            var self = this;
            var html = Reporter.error_wrap_tpl.render(error);
            
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
            var self = this;
            var reports = self.$el.all('.report');

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
            'css-combo': 'css_combo_tpl'
        },

        parserPluginReports: function (reports) {

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
                    case 'lesscss':
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
        'css_combo_tpl': Template(css_combo_tpl.html)
    });
    return Reporter;
}, {
    requires: [
        'template',
        'page/template/report-fb-tpl',
        'page/template/report-wrap-tpl',
        'page/template/report-error-wrap-tpl',
        'page/template/report-plugin-tpl',
        'page/template/report-csslint-tpl',
        'page/template/report-files-tpl',
        'page/template/report-concat-tpl',
        'page/template/report-css-combo-tpl'

    ]
});KISSY.add('page/template/report-fb-tpl',function(){
    return {"html":"<div class=\"report-fb\">\n    <span class=\"number\">\n        {{build_version}}\n    </span>\n    <b class='block'></b><b class='triangle'></b>\n    <span class=\"number\">\n        {{build_timestamp}}\n    </span>\n    <span class=\"number used-time\">\n        {{build_used_time}}ms\n    </span>\n</div>"};
});KISSY.add('page/template/report-wrap-tpl',function(){
    return {"html":"<div class=\"report\" style='display:none'>\n    <div class=\"report-hd\">{{fb}}</div>\n    <div class=\"report-bd\">{{plugins}}</div>\n</div>"};
});KISSY.add('page/template/report-error-wrap-tpl',function(){
    return {"html":"<div class=\"report\" style='display:none'>\n    <div class=\"report-bd\">\n        <div class=\"alert alert-error\">\n            <h2> {{message}} </h2>\n            <h4>error</h4>\n            <pre>{{text}}</pre>\n            <h4>stack</h4>\n            <pre>{{stack}}</pre>\n        </div>\n    </div>\n</div>"};
});KISSY.add('page/template/report-plugin-tpl',function(){
    return {"html":"<div class=\"report-plugin-item\">\n    <div class=\"report-plugin-item-hd{{#if content}} report-plugin-hd-has-content{{/if}}\">\n        <h4>{{name}} \n        {{#if typeof report.count === 'number'}}\n        <span class='plugin-bdg'>\n            <span class=\"badge\">{{report.count}}</span>\n        </span>\n        {{/if}}\n        {{#if typeof report.warningCount === 'number' && report.warningCount > 0}}\n        <span class='plugin-bdg'>\n            <span class=\"badge badge-warning\">{{report.warningCount}}</span>\n        </span>\n        {{/if}}\n        {{#if typeof report.errorCount === 'number' && report.errorCount > 0}}\n        <span class='plugin-bdg'>\n            <span class=\"badge badge-important\">{{report.errorCount}}</span>\n        </span>\n        {{/if}}\n        </h4>\n    </div>\n    {{#if content}}\n    <div class='report-plugin-item-bd'>{{content}}</div>\n    {{/if}}\n    <div class=\"report-plugin-item-ft\">\n        <ul>\n            <li class='used-time'><i class='icon-time'></i> {{report.used_time}} ms\n            </li>\n        </ul>\n    </div>\n</div>"};
});KISSY.add('page/template/report-csslint-tpl',function(){
    return {"html":"<div class=\"csslint-list\">\n    {{#if lintReport&&lintReport.length}}\n        {{#each lintReport as item}}\n            <div class='csslint-list-item'>\n                <h4 class='csslint-file'>{{item.file}}</h4>\n                <p>{{item.fullpath}}</p>\n                <pre>{{item.output}}</pre>\n            </div>\n        {{/each}}\n    {{#else}}\n        没有CSS文件\n    {{/if}}\n</div>\n"};
});KISSY.add('page/template/report-files-tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\n{{#if !files.length}}\n    <div>\n        没有文件\n    </div>\n{{#else}}\n    <ul class=\"plugin-file-list\">\n        {{#each files as file}}\n            <li>\n                <i class=\"icon-file\"></i> {{file}}\n            </li>\n        {{/each}}\n    </ul>\n{{/if}}\n"};
});KISSY.add('page/template/report-concat-tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\r\n{{#if !jobs.length}}\r\n    <div>\r\n        没有文件\r\n    </div>\r\n{{#else}}\r\n    <ul >\r\n        {{#each jobs as job}}\r\n            <li>\r\n                <h4><i class=\"icon-file\"></i> {{job.filename}}</h4>\r\n                <ul class=\"plugin-file-list\">\r\n                    {{#each job.files as file}}\r\n                        <li title='{{file.path}}'>{{file.filename}}</li>\r\n                    {{/each}}\r\n                </ul>\r\n            </li>\r\n        {{/each}}\r\n    </ul>\r\n{{/if}}\r\n"};
});KISSY.add('page/template/report-css-combo-tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\r\n{{#if !jobs.length}}\r\n    <div>\r\n        没有文件\r\n    </div>\r\n{{#else}}\r\n    <ul >\r\n        {{#each jobs as job}}\r\n            <li>\r\n                <h4><i class=\"icon-file\"></i> {{job.filename}} </h4>\r\n                <ul class=\"plugin-file-list\">\r\n                    {{#each job.imports as file}}\r\n                        <li>\r\n                            <i class=\"icon-bookmark\"></i>  \r\n                            {{file}}\r\n                        </li>\r\n                    {{/each}}\r\n                </ul>\r\n            </li>\r\n        {{/each}}\r\n    </ul>\r\n{{/if}}\r\n"};
});KISSY.add('page/mods/timestamp',function (S) {

    var $ = S.all;

    S.ready(function () {
        $('body').delegate('click', '.build-timestamp', function (ev) {
            var $et = $(ev.target);
            $('.timestamp-input').val($et.html());
        })
    })
});KISSY.add('page/index',function (S, pageBuilder, Calendar, Reporter) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        // buildPage.init();
        var reporter = new Reporter('#reports');

        pageBuilder.on('report', function (ev) {
            reporter.addReport(ev.reports);
        });

        pageBuilder.on('error', function (ev) {
            reporter.addError(ev.error);
        });

        Calendar.init({
            triggers: 'input.timestamp-input'
        });

    });
    
}, {
    requires: ['utils/build-page', 'utils/calendar-init', './mods/reporter', './mods/timestamp']
});