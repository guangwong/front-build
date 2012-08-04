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
            'csslint': function (report) {
                return Reporter.csslint_tpl.render(report);
            },
            'kissy-template': function (report) {
                return Reporter.kissy_template_tpl.render(report);
            },
            'uglifyjs': function (report) {
                return Reporter.uglifyjs_tpl.render(report);
            },
            'cssmin': function (report) {
                return Reporter.cssmin_tpl.render(report);
            },
            'concat': function (report) {
                return Reporter.concat_tpl.render(report);
            }
        },

        renderer: {
            fb: function (report) {
                return Reporter.fb_tpl.render(report);
            },

            plugins: function (report) {
                var self = this;
                var o = [];
                S.each(report, function (item) {
                    var name = item.name;
                    var render = self.pluginRenderer[name] || null;
                    var content = render ? render(item) : '';
                    o.push(Reporter.plugin_tpl.render({
                        name: name,
                        content: content
                    }));
                });
                return o.join('');
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
        'concat_tpl': Template(concat_tpl.html)
    });
    return Reporter;
}, {
    requires: [
        'template',
        'page/template/report-fb.tpl.js',
        'page/template/report-wrap.tpl.js',
        'page/template/report-plugin.tpl.js',
        'page/template/report-csslint.tpl.js',
        'page/template/report-kissy-template.tpl.js',
        'page/template/report-uglifyjs.tpl.js',
        'page/template/report-cssmin.tpl.js',
        'page/template/report-concat.tpl.js'

    ]
});