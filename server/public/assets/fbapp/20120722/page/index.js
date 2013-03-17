/*
combined files : 

utils/build-page
utils/build-common
utils/calendar-init
utils/app-history
utils/local-cache
page/mods/group-select
utils/analytics
page/index

*/

//noinspection JSValidateTypes
KISSY.add('utils/build-page',function (S, IO, Base) {

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

//noinspection JSValidateTypes
KISSY.add('utils/build-common',function (S, Node) {
    var $ = Node.all;

    return {
        init: function () {
            var $elCommonBuild = $('#fb-build-common');
            var $elStatus = $elCommonBuild.siblings('.status');

            $elCommonBuild.on('click', function (ev) {
                var $et = $(ev.target);
                ev.preventDefault();
                $elStatus.html('building...');
                analytics.track('Build Common');

                S.ajax({
                    url: $et.attr('href'),
                    dataType: 'json',
                    success: function (data) {
                        if (data.err) {
                            var err = data.err;
                            $elStatus
                                .html('Error:' + err.message);
                            return;
                        }
                        $elStatus.html('success!');
                        setTimeout(function () {
                            $elStatus.html('')
                        }, 2000)
                    }
                });
            });
            
        }
    };
}, {
    requires: ['node']
});
KISSY.add('utils/calendar-init',function (S, Node,  Calendar, Overlay) {
    var $ = Node.all;
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
                });




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
    requires: ['node', 'calendar', 'overlay']
});
KISSY.add('utils/app-history',function (S) {
    if (!window.localStorage) {
        return null;
    }

    var KEY = 'AppHistory';

    function getList() {
        var src = localStorage.getItem(KEY);

        if (!src) {
            return [];
        }
        try {
            var list = src.split(',');
        } catch (e) {
            return [];
        }

        return list;
    }

    function saveList(list) {
        return localStorage.setItem(KEY, list.join(','));
    }

    return {
        push: function (path) {
            var list = getList();

            list = S.filter(list, function (item) {
                return item != path;
            });

            list.unshift(path);
            saveList(list);
        },
        
        get: function () {
            return getList();
        },
        
        rm: function (path) {
            var list = getList();
            list = S.filter(list, function (item) {
                return item != path
            });
            saveList(list);
            return true;
        }
    }
});
KISSY.add('utils/local-cache',function (S) {
    /**
     * Local Storage
     * @param key
     * @constructor
     */
    function PageCache (key) {
        var self = this;
        self.KEY = key;
    }

    S.augment(PageCache, {
        set: function(k, v) {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            obj[k] = v;
            self.save();
        },

        save: function() {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            localStorage.setItem(KEY, JSON.stringify(obj));
        },

        get: function(k) {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            return obj[k];
        },

        getAll: function() {
            var self = this;
            var KEY = self.KEY;
            if (self._cache) {
                return self._cache;
            }
            var str = localStorage.getItem(KEY);
            if (!str) {
                self._cache = {};
            } else {
                self._cache = JSON.parse(str) || {};
            }
            return self.getAll();
        }
    });

    return PageCache;
});
KISSY.add('page/mods/group-select',function (S) {
    var $ = S.all;
    var sel_checkbox = '.j-version-checkbox';
    S.ready(function () {
        $('body')
            .delegate('click', '.j-select-group', function (ev) {
                // ����һ��Groupʱ����ѡ����Ӧ��Version
                var $et = $(ev.target);
                ev.preventDefault();
                var versions = $et.attr('title');
                if (versions) {
                    versions = versions.split(',');
                } else {
                    versions = [];
                }

                $(sel_checkbox).each(function (el) {
                    if (S.indexOf(el.val(), versions) > -1) {
                        el.prop('checked', true);
                    } else {
                        el.prop('checked', false);
                    }
                });

                analytics.track('Select Group');
            })
            .delegate('click', '.j-version-checkbox', function (ev) {
                // ȷ��һ��ֻѡ��һ��Version
                var $et = $(ev.target);
                var val = $et.val();
                var pagename = val.split('/')[0];

                $(sel_checkbox).each(function (el) {
                    var elval = el.val();
                    if (elval !== val && el.val().split('/')[0] === pagename) {
                        el.prop('checked', false);
                    }
                });

                analytics.track('Select Version');


            })
    });
});
//noinspection JSValidateTypes
KISSY.add('utils/analytics',function (S, Node) {
    var $ = Node.all;
    return {
        init: function () {
            $('body').on('click', function(ev){
                var $et = $(ev.target);
                var trackType = $et.attr('data-track');
                if (trackType) {
                    analytics.track(trackType);
                }
            });
        }
    }

}, {
    requires: ['node']
});
//noinspection JSValidateTypes
KISSY.add('page/index',function (S, Node, PageBuilder, buildCommon, Calendar, appHistory, localCache, Analytics) {
    var $ = Node.all;

    function restoreConfig(appCache) {
        $('#batch-build-timestamp').val(appCache.get('timestamp'));

        var pages = appCache.get('pages');
        if (pages) {
            $('input.j-version-checkbox')
                .filter(function (el) {
                    return S.indexOf(el.value, pages) > -1;
                })
                .prop('checked', true);
        }
    }


    /**
     * Get all checked pages
     * @return {Array}
     */
    function getCheckedPages() {
        var pages = [];
        $('input.j-version-checkbox').each(function($input) {
            if ($input.prop('checked') && $input.val()) {
                pages.push({
                    el: $input.parent('.version'),
                    val: $input.val()
                });
            }
        });
        return pages;
    }

    function execQueue(queue, fn, callback) {

        function doit(index) {
            if (index >= queue.length) {
                callback();
                return;
            }

            fn(queue[index], index, function(err){
                if (err) {
                    callback(err);
                    return;
                }
                doit(index + 1);
            });
        }
        doit(0);
    }

    /**
     * init the builder
     * @param config
     * @param config.rootDir
     * @param appCache appCache
     */
    function initBuilder (config, appCache) {
        var pageBuilder = new PageBuilder({
            rootDir: config.rootDir
        });
        var $timestamp = $('#batch-build-timestamp');
        var $status = $('#batch-build-status');
        var $btn = $('#batch-build');

        $btn
            .on('click', function (ev) {
                ev.preventDefault();
                var timestamp = $timestamp.val();
                var queue = getCheckedPages();

                if (!queue.length) {
                    return;
                }

                S.each(queue, function(item){
                    item.el
                        .removeClass('st-error')
                        .removeClass('st-ok')
                        .removeClass('st-building')
                        .addClass('st-queued');
                });



                startTime = new Date().getTime();
                execQueue(
                    queue,
                    function(task, index, callback) {
                        var $el = task.el;
                        $el.addClass('st-building');
                        pageBuilder.build(task.val, timestamp, function (err, data) {
                            $el.removeClass('st-building');
                            if (err) {
                                $el.addClass('st-error');
                                callback(err);
                                return;
                            }
                            $el.addClass('st-ok');
                            callback(null);
                        });
                    },

                    function (err) {
                        if (err) {
                            $status.html(err.message).show();
                            if (ev.fromBuild) {
                                S.log(err);
                            }
                        }

                        var usedTime = new Date().getTime() - startTime;

                        analytics.track('Build Pages', {
                            length: queue.length,
                            avTime: usedTime/queue.length
                        });

                        setTimeout(function () {
                            S.each(queue, function(item){
                                item.el
                                    .removeClass('st-error')
                                    .removeClass('st-ok')
                                    .removeClass('st-building')
                                    .removeClass('st-queued');
                            });
                        }, 100);
                        
                        setTimeout(function() {
                            $status.hide();
                        },2000);
                    });


                appCache.set('timestamp', timestamp);
                appCache.set('pages', S.map(queue, function (task) {
                    return task.val;
                }));
            });

        return pageBuilder;
    }
    /**
     * app page init
     * @param config
     * @param config.rootDir
     */
    function init (config) {
        var appCache = new localCache('app-cache:' + config.rootDir);

        S.ready(function () {
            Calendar.init({
                triggers: 'input.timestamp-input'
            });

            buildCommon.init();

            initBuilder(config, appCache);

            appHistory.push(config.rootDir);

            restoreConfig(appCache);

            Analytics.init();

        });
    }


    return {
        init: init
    }

}, {
    requires: [
        'node',
        'utils/build-page',
        'utils/build-common',
        'utils/calendar-init',
        'utils/app-history',
        'utils/local-cache',
        './mods/group-select',
        'utils/analytics'
    ]
});
