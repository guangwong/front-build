
//noinspection JSValidateTypes
KISSY.add(function (S, IO, Base) {

    function PageBuilder () {
        var self = this;
        PageBuilder.superclass.constructor.apply(self, arguments);
    }

    S.extend(PageBuilder, Base, /**@lends PageBuilder.prototype */{
        /**
         * build pages to a timestamp
         * @param {Array|String} pages to build
         * @param {String} timestamp build to
         * @param {Function} callback
         */
        build: function(pages, timestamp, callback) {
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

            self.fire(PageBuilder.EV.BUILD, {
                pages: pages,
                timestamp: timestamp
            });

            IO({
                url: self.get('url'),
                data: {
                    timestamp: timestamp,
                    pages: pages.join(','),
                    root: self.get('rootDir')
                },
                cache: false,
                dataType: 'json',
                success: function (data) {
                    if (!callback) {
                        if (data.err) {
                            self.fire(PageBuilder.EV.ERROR, {
                                fromBuild: true,
                                error: data.err
                            });
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
                        return;
                    }

                    if (data.err) {
                        callback(data.err);
                        return;
                    }
                    callback(null, {
                        pages: pages,
                        timestamp: timestamp,
                        reports: data.reports
                    });
                }
            });

        }
    }, /**@lends PageBuilder */{
        EV: {
            GROUP_BUILD: 'group-build',
            ERROR: 'error',
            REPORT: 'report',
            SUCCESS: 'success',
            BUILD_ERROR: 'build-error',
            BUILD: 'build'
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
}, {
    requires: ['ajax', 'base']
});
