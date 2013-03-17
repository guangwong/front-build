//noinspection JSValidateTypes
KISSY.add(function (S, Node, PageBuilder, buildCommon, Calendar, appHistory, localCache, Analytics) {
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