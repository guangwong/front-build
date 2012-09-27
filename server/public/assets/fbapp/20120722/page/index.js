/*
combined files : 

utils/build-page
utils/build-common
utils/calendar-init
utils/app-history
page/mods/app-cache
page/mods/group-select
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
KISSY.add('utils/build-common',function (S) {
    var $ = S.all;

    return {
        init: function () {
            var $elCommonBuild = $('#fb-build-common');
            var $elStatus = $elCommonBuild.siblings('.status');

            $elCommonBuild.on('click', function (ev) {
                var $et = $(ev.target);
                ev.preventDefault();
                $elStatus.html('building...');

                S.ajax({
                    url: $et.attr('href'),
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
                        }, 2000)
                    }
                });
            });
            
        }
    };
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
            var list = getList();
            return list;
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
KISSY.add('page/mods/app-cache',function (S) {
    function AppCache (root) {
        if (!root || typeof root !== 'string') {
            throw new Error('NoApp');
        }
        var self = this;
        self.root = root;
        self.KEY = 'app-cache:' + self.root;
    }

    S.augment(AppCache, {
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

    return AppCache;
});
KISSY.add('page/mods/group-select',function (S) {
    var $ = S.all;
    var sel_checkbox = '.j-version-checkbox';
    S.ready(function () {
        $('body')
            .delegate('click', '.j-select-group', function (ev) {
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
                })
            })
            .delegate('click', '.j-version-checkbox', function (ev) {
                var $et = $(ev.target);
                var val = $et.val();
                var pagename = val.split('/')[0];

                $(sel_checkbox).each(function (el) {
                    var elval = el.val();
                    if (elval !== val && el.val().split('/')[0] === pagename) {
                        el.prop('checked', false);
                    }
                });
            })
    });
});
KISSY.add('page/index',function (S, pageBuilder, buildCommon, Calendar, appHistory, AppCache) {
    var $ = S.all;
    var search = location.search.substr(1);
    var query = S.unparam(search);
    var root = query.root;

    var appCache = new AppCache(root);
    S.ready(function () {
        Calendar.init({
            triggers: 'input.timestamp-input'
        });
        buildCommon.init();
        
        pageBuilder.on('group-build', function(ev) {
            appCache.set('timestamp', ev.timestamp);
            appCache.set('pages', ev.pages);
        });

        $('#batchbuild-timestamp').val(appCache.get('timestamp'));
        var cachepages = appCache.get('pages');
        if (cachepages) {
            $('input.j-version-checkbox').filter(function (el) {
                return S.indexOf(el.value, cachepages) > -1
            }).prop('checked', true);
        }
    });

    return {
        appHistory: appHistory
    }
    
}, {
    requires: [
        'utils/build-page',
        'utils/build-common',
        'utils/calendar-init',
        'utils/app-history',
        './mods/app-cache',
        './mods/group-select'
    ]
});
