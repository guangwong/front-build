//noinspection JSValidateTypes
KISSY.add(function (S, Template,
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