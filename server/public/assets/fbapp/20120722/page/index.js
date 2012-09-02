/*
combined files : 

utils/build-page
utils/build-common
utils/calendar-init
utils/app-history
page/index

*/
KISSY.add('utils/build-page',function (S) {
    var $ = S.all;

    function PageBuilder () {
        var $buildbtn = $('.fb-build-page');
        var self = this;
        $buildbtn.on('click', function (ev) {
            ev.preventDefault();
            var $btn = $(ev.target);
            var $elStatus = $btn.siblings('.status');
            var $input = $btn.siblings('input');
            $elStatus.html('building...');
            var timestamp = $input.val();

            S.ajax({
                url: $btn.attr('href'),
                data: {
                    timestamp: timestamp
                },
                dataType: 'json',
                success: function (data) {

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
                }
            });
        });
    }

    S.extend(PageBuilder, S.Base);

    return new PageBuilder();
});KISSY.add('utils/build-common',function (S) {
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
});KISSY.add('utils/calendar-init',function (S, Calendar, Overlay) {
    var $ = S.all;
    return {
        init: function (config) {
            var hideTimeout;

            var popup = new Overlay.Popup({
                width:192
            });

            popup.render();

            var cal = new Calendar(popup.get('contentEl'));

            cal.on('select', function(e) {
                if (this.targetInput) {
                    $(this.targetInput).val(S.Date.format(e.date, 'yyyymmdd'));
                }
                popup.hide();
            });

            $(config.triggers)
                .on('click', function (ev) {
                    clearTimeout(hideTimeout);
                    popup.show();
                    var et = $(ev.target);
                    popup.align(et, ['bl', 'tl']);
                    cal.targetInput = et;
                })
                .on('blur', function (ev) {
                    hideTimeout = setTimeout(function () {
                        popup.hide();
                    }, 300);
                });
        }
    }
}, {
    requires: ['calendar', 'overlay', 'calendar/assets/base.css']
});KISSY.add('utils/app-history',function (S) {
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
        }
    }
});KISSY.add('page/index',function (S, pageBuilder, buildCommon, Calendar, appHistory) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        Calendar.init({
            triggers: 'input.timestamp-input'
        });
        buildCommon.init();
        var search = location.search.substr(1);
        var query = S.unparam(search);
        
        if (appHistory) {
            appHistory.push(query.root);
        }
    });
    
}, {
    requires: ['utils/build-page', 'utils/build-common', 'utils/calendar-init', 'utils/app-history']
});