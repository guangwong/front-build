KISSY.add(function (S, Template, fb_tpl, wrap_tpl, plugin_tpl, csslint_tpl, kissy_template_tpl, uglifyjs_tpl, cssmin_tpl, concat_tpl) {
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
});