KISSY.add(function (S) {
    var $ = S.all;

    function PageBuilder () {
        var self = this;
        PageBuilder.superclass.constructor.apply(self, arguments);
    }

    S.extend(PageBuilder, S.Base, {
        /**
         * exec build pages
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
                        self.fire(PageBuilder.EV.BUILD_ERROR, data.err);
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
    }, {
        EV: {
            GROUP_BUILD: 'group-build',
            ERROR: 'error',
            REPORT: 'report',
            SUCCESS: 'success',
            BUILD_ERROR: 'build-error'
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
