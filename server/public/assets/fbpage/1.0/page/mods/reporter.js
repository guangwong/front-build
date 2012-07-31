KISSY.add(function (S, Template, fb_tpl, wrap_tpl, plugin_tpl, csslint_tpl, kissy_template_tpl, uglifyjs_tpl) {
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

            var html = Reporter.template_wrap.render(outputs);

            var reports = self.$el.all('.report');

            if (reports.length > 0) {
                $(html).insertBefore(reports[0]);
            } else {
                $(html).appendTo(self.$el);
            }
        },

        pluginRenderer: {
            'csslint': function (report) {
                return Reporter.template_csslint.render(report);
            },
            'kissy-template': function (report) {
                return Reporter.template_kissy_template.render(report);
            },
            'uglifyjs': function (report) {
                return Reporter.template_uglifyjs.render(report);
            }
        },

        renderer: {
            fb: function (report) {
                return Reporter.template_fb.render(report);
            },

            plugins: function (report) {
                var self = this;
                var o = [];
                console.log(report);
                S.each(report, function (item) {
                    var name = item.name;
                    var render = self.pluginRenderer[name] || null;
                    var content = render ? render(item) : '';
                    console.log(name)
                    o.push(Reporter.template_plugin.render({
                        name: name,
                        content: content
                    }));
                });
                return o.join('');
            }
        }

    }, {
        'template_fb' : Template(fb_tpl.html),
        'template_plugin': Template(plugin_tpl.html),
        'template_wrap': Template(wrap_tpl.html),
        'template_csslint': Template(csslint_tpl.html),
        'template_kissy_template': Template(kissy_template_tpl.html),
        'template_uglifyjs': Template(uglifyjs_tpl.html)
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
        'page/template/report-uglifyjs.tpl'

    ]
});