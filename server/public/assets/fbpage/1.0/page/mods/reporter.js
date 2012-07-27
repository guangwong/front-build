KISSY.add(function (S, Template, fb_tpl, wrap_tpl, plugin_tpl) {
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
});