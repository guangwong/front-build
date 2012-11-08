KISSY.add(function (S, PageBuilder, buildCommon, Calendar, appHistory, localCache) {
    var $ = S.all;

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
        var $status = $('#batch-build-status')
        var $btn = $('#batch-build');
        $btn
            .on('click', function (ev) {
                ev.preventDefault();
                var timestamp = $timestamp.val();
                var pages = [];
                $('input.j-version-checkbox').each(function ($input) {
                    if ($input.prop('checked') && $input.val()) {
                        pages.push($input.val());
                    }
                });
                pageBuilder.build(pages, timestamp);
            });

        pageBuilder
            .on('error', function (err) {
                $status.html(err.message).show();
            })
            .on('success', function (ev) {
                appCache.set('timestamp', ev.timestamp);
                appCache.set('pages', ev.pages);
                $status.html('success');
                setTimeout(function () {
                    $status.hide();
                }, 1500);
            })
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
        });
    }


    return {
        init: init
    }

}, {
    requires: [
        'utils/build-page',
        'utils/build-common',
        'utils/calendar-init',
        'utils/app-history',
        'utils/local-cache',
        './mods/group-select'
    ]
});