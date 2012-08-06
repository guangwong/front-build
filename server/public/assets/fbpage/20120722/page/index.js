/*
combined files : 

utils/build-page
utils/calendar-init
page/mods/reporter
page/template/report-fb.tpl
page/template/report-wrap.tpl
page/template/report-plugin.tpl
page/template/report-csslint.tpl
page/template/report-kissy-template.tpl
page/template/report-uglifyjs.tpl
page/template/report-cssmin.tpl
page/template/report-concat.tpl
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
                            .html('Error:' + err.message)
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

            var popup = new Overlay.Popup({
                width:192
            });
            popup.render();

            var cal = new Calendar(popup.get('contentEl')).on('select', function(e) {
                if (this.targetInput) {
                    $(this.targetInput).val(S.Date.format(e.date, 'yyyymmdd'));
                }
                popup.hide();
            });

            $(config.triggers).on('click', function (ev) {
                popup.show();
                var et = $(ev.target);
                popup.align(et, ['bl', 'tl']);
                cal.targetInput = et;
            });
            $('body').on('mousedown', function (ev) {
                if (!popup.get('contentEl').contains(ev.target)) {
                    popup.hide();
                }
            });
        }
    }
}, {
    requires: ['calendar', 'overlay', 'calendar/assets/base.css']
});KISSY.add('page/mods/reporter',function (S, Template, fb_tpl, wrap_tpl, plugin_tpl, csslint_tpl, kissy_template_tpl, uglifyjs_tpl, cssmin_tpl, concat_tpl) {
    var $ = S.all;

    var Reporter = function (container) {
        var self = this;
        self.$el = $(container);
        if (!self.$el || !self.$el.length) {
            throw new Error('container is not found');
        }

        S.ready(function() {
            self.init();
        })

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

        addReport: function (reports) {
            var self = this;
            var outputs = {};

            S.each(reports, function (report, key) {
                if (self.renderer[key] && report) {
                    outputs[key] = self.renderer[key].call(self, report);
                }
            });

            var html = Reporter.wrap_tpl.render(outputs);

            var reports = self.$el.all('.report');

            if (reports.length > 0) {
                $(html).insertBefore(reports[0]);
            } else {
                $(html).appendTo(self.$el);
            }
        },

        pluginRenderer: {
            'csslint': 'csslint_tpl',
            'kissy-template': 'kissy_template_tpl',
            'uglifyjs': 'uglifyjs_tpl',
            'cssmin': 'cssmin_tpl',
            'concat': 'concat_tpl',
            'css-combo': 'css_combo_tpl'
        },

        pluginReportMapper: function (reports) {
        },

        renderer: {
            fb: function (report) {
                return Reporter.fb_tpl.render(report);
            },

            plugins: function (reports) {
                var self = this;
                var html = [];
                S.each(reports, function (report) {
                    var name = report.name;
                    var tmpl = self.pluginRenderer[name] || null;
                    if (tmpl) {
                        tmpl = Reporter[tmpl];
                    }
                    console.log(self.pluginRenderer)
                    console.log(name, tmpl);
                    var content = tmpl ? tmpl.render(report) : '';
                    html.push(Reporter.plugin_tpl.render({
                        name: name,
                        report: report,
                        content: content
                    }));
                });
                console.log(html);
                return html.join('');
            }
        }

    }, {
        'fb_tpl' : Template(fb_tpl.html),
        'plugin_tpl': Template(plugin_tpl.html),
        'wrap_tpl': Template(wrap_tpl.html),
        'csslint_tpl': Template(csslint_tpl.html),
        'kissy_template_tpl': Template(kissy_template_tpl.html),
        'uglifyjs_tpl': Template(uglifyjs_tpl.html),
        'cssmin_tpl': Template(cssmin_tpl.html),
        'concat_tpl': Template(concat_tpl.html),
        'css_combo_tpl': Template(cssmin_tpl.html)
    });
    return Reporter;
}, {
    requires: [
        'template',
        'page/template/report-fb.tpl',
        'page/template/report-wrap.tpl',
        'page/template/report-plugin.tpl',
        'page/template/report-csslint.tpl',
        'page/template/report-kissy-template.tpl',
        'page/template/report-uglifyjs.tpl',
        'page/template/report-cssmin.tpl',
        'page/template/report-concat.tpl'

    ]
});KISSY.add('page/template/report-fb.tpl',function(){
    return {"html":"<div class=\"report-fb\">\n    <div class=\"row-fluid\">\n        <dl class='span4'>\n            <dt>版本</dt>\n            <dd>{{build_version}}</dd>\n        </dl>\n        <dl class='span4'>\n            <dt>打包时间戳</dt>\n            <dd>{{build_timestamp}}</dd>\n        </dl>\n        <dl class='span4'>\n            <dt>用时</dt>\n            <dd>{{build_used_time}}ms</dd>\n        </dl>\n    </div>\n</div>"};
});KISSY.add('page/template/report-wrap.tpl',function(){
    return {"html":"<div class=\"report\">\n    <div class=\"report-hd\">{{fb}}</div>\n    <div class=\"report-bd\">{{plugins}}</div>\n</div>"};
});KISSY.add('page/template/report-plugin.tpl',function(){
    return {"html":"<div class=\"report-plugin-item\">\n    <div class=\"report-plugin-item-hd{{#if content}} report-plugin-hd-has-content{{/if}}\">\n        <h4>{{name}}</h4>\n    </div>\n    {{#if content}}\n    <div class='report-plugin-item-bd'>{{content}}</div>\n    {{/if}}\n    <div class=\"report-plugin-item-ft\">\n        <ul>\n            <li>用时 {{report.used_time}} ms</li>\n        </ul>\n    </div>\n</div>"};
});KISSY.add('page/template/report-csslint.tpl',function(){
    return {"html":"<div class=\"csslint-list\">\n    {{#if lintReport && lintReport.length}}\n        {{#each lintReport as item}}\n            <div class='csslint-list-item'>\n                <h4 class='csslint-file'>{{item.file}}</h4>\n                <p>{{item.fullpath}}</p>\n                <pre>{{item.output}}</pre>\n            </div>\n        {{/each}}\n    {{#else}}\n        没有CSS文件\n    {{/if}}\n</div>"};
});KISSY.add('page/template/report-kissy-template.tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\n{{#if !files.length}}\n    <div>\n        没有文件\n    </div>\n{{#else}}\n    <ul class=\"plugin-file-list\">\n        {{#each files as file}}\n            <li>\n                <i class=\"icon-file\"></i> {{file}}\n            </li>\n        {{/each}}\n    </ul>\n{{/if}}"};
});KISSY.add('page/template/report-uglifyjs.tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\n{{#if !files.length}}\n    <div>\n        没有文件\n    </div>\n{{#else}}\n    <ul class=\"plugin-file-list\">\n        {{#each files as file}}\n            <li>\n                <i class=\"icon-file\"></i> {{file}}\n            </li>\n        {{/each}}\n    </ul>\n{{/if}}"};
});KISSY.add('page/template/report-cssmin.tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\n{{#if !files.length}}\n    <div>\n        没有文件\n    </div>\n{{#else}}\n    <ul class=\"plugin-file-list\">\n        {{#each files as file}}\n            <li>\n                <i class=\"icon-file\"></i> {{file}}\n            </li>\n        {{/each}}\n    </ul>\n{{/if}}\n"};
});KISSY.add('page/template/report-concat.tpl',function(){
    return {"html":"<h4>处理文件列表:</h4>\r\n{{#if !jobs.length}}\r\n    <div>\r\n        没有文件\r\n    </div>\r\n{{#else}}\r\n    <ul >\r\n        {{#each jobs as job}}\r\n            <li>\r\n                <h4><i class=\"icon-file\"></i> {{job.filename}}</h4>\r\n                <ul class=\"plugin-file-list\">\r\n                    {{#each job.files as file}}\r\n                        <li title='{{file.path}}'>{{file.filename}}</li>\r\n                    {{/each}}\r\n                </ul>\r\n            </li>\r\n        {{/each}}\r\n    </ul>\r\n{{/if}}\r\n"};
});KISSY.add('page/index',function (S, pageBuilder, Calendar, Reporter) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        // buildPage.init();
        var reporter = new Reporter('#reports')
        pageBuilder.on('report', function (ev) {
            reporter.addReport(ev.reports);
        });

        Calendar.init({
            triggers: 'input.timestamp-input'
        });

    });
    
}, {
    requires: ['utils/build-page', 'utils/calendar-init', './mods/reporter']
});