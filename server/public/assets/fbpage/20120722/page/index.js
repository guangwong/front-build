/*
combined files : 

utils/build-page
utils/calendar-init
page/mods/reporter
page/template/report-fb.tpl
page/template/report-wrap.tpl
page/template/report-plugin.tpl
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
});KISSY.add('page/mods/reporter',function (S, Template, fb_tpl, wrap_tpl, plugin_tpl) {
    var $ = S.all;

    var Reporter = function (container) {
        var self = this;
        self.$el = $(container);
        if (!self.$el || !self.$el.length) {
            throw new Error('container is not found');
        }

    }

    S.extend(Reporter, S.Base, {
        /**
         * add reporter for plugin
         */
        addPluginReporter: function () {

        },

        addReport: function (reports) {
            var self = this;
            self.appendReportHTML(reports);
            return;
            var outputs = [];
            var html = S.each(reports, function (report, key) {
                if (self.plugins[key]) {
                    outputs.push(self.plugins[key].call(self, report));
                }
            });
            self.appendReportHTML(outputs.join(''));
        },

        appendReportHTML: function (reports) {
            var self = this;

            html = Reporter.template_report.render({
                fb_report: self.plugins.fb.call(self, reports.fb),
                fb_plugin: self.plugins.plugins.call(self, reports.plugins)
            });

            var reports = self.$el.all('.report');

            if (reports.length > 0) {
                $(html).insertBefore(reports[0]);
            } else {
                $(html).appendTo(self.$el);
            }

        },

        plugins: {
            fb: function (report) {
                return Reporter.template_fb.render(report);
            },

            plugins: function (report) {
                console.log(report);
                var o = [];
                S.each(report, function (item) {
                    o.push(Reporter.template_plugin.render({
                        text: JSON.stringify(item, ' ', 2)
                    }))
                });
                return o.join('');
            }
        }

    }, {
        'template_fb' : Template(fb_tpl.html),
        'template_plugin': Template(plugin_tpl.html),
        'template_report': Template(wrap_tpl.html)
    });
    return Reporter;
}, {
    requires: [
        'template',
        'page/template/report-fb.tpl',
        'page/template/report-wrap.tpl',
        'page/template/report-plugin.tpl'
    ]
});KISSY.add('page/template/report-fb.tpl',function(){
    return {"html":"<div class=\"report-fb\">\n    <div class=\"row-fluid\">\n        <dl class='span4'>\n            <dt>版本</dt>\n            <dd>{{build_version}}</dd>\n        </dl>\n        <dl class='span4'>\n            <dt>打包时间戳</dt>\n            <dd>{{build_timestamp}}</dd>\n        </dl>\n        <dl class='span4'>\n            <dt>用时</dt>\n            <dd>{{build_used_time}}ms</dd>\n        </dl>\n    </div>\n</div>"};
});KISSY.add('page/template/report-wrap.tpl',function(){
    return {"html":"<div class=\"report\">\n    <div class=\"report-hd\">{{fb_report}}</div>\n    <div class=\"report-bd\">{{content}}</div>\n</div>"};
});KISSY.add('page/template/report-plugin.tpl',function(){
    return {"html":"<div class=\"report-plugin-item\">\n    <pre>{{text}}</pre>\n</div>"};
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