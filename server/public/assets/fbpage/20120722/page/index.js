/*
combined files : 

utils/build-page
utils/calendar-init
page/mods/reporter
page/mods/timestamp
page/index

*/
KISSY.add('utils/build-page',function (S) {
    var $ = S.all;

    function buildPages(url, data, callback) {

        S.ajax({
            url: url,

            data: data,

            cache: false,
            dataType: 'json',
            success: function (data) {
                callback(null, data);
                
            }
        });
    }

    function PageBuilder () {
        var self = this;
        $('body').delegate('click', '.fb-build-page', function (ev) {
            ev.preventDefault();
            var $btn = $(ev.target);
            var $buildblock = $btn.parent('.buildto-block');
            var isGroupBuild = $btn.attr('data-group-build');
            var $elStatus = $buildblock.one('.status');
            var $input = $buildblock.one('input');
            $elStatus.html('building...');
            var pages = [];
            var timestamp = $input.val();

            if (isGroupBuild) {
                $('input.j-version-checkbox').each(function ($input) {
                    if ($input.prop('checked') && $input.val()) {
                        pages.push($input.val());
                    }
                });

                self.fire('group-build', {
                    pages: pages,
                    timestamp: timestamp
                });

                buildPages($btn.attr('href'),
                    {
                        timestamp: timestamp,
                        pages: pages.join(',')
                    },

                    function (err, data) {
                        if (err) {
                            return S.error(err);
                        }

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
                    });

            } else {
                buildPages($btn.attr('href'), 
                    {
                        timestamp: timestamp
                    },
                    function (err, data) {
                        if (err) {
                            return S.error(err);
                        }

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
                    });
                if ($btn.attr('data-page')) {
                    pages.push($btn.attr('data-page'));
                }
            }


            
        });
    }

    S.extend(PageBuilder, S.Base);

    return new PageBuilder();
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
KISSY.add('page/mods/reporter',function (S, Template, fb_tpl, wrap_tpl, error_wrap_tpl, plugin_tpl, csslint_tpl, files_tpl, concat_tpl, css_combo_tpl) {
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
KISSY.add('page/index',function (S, pageBuilder, Calendar, Reporter) {
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
