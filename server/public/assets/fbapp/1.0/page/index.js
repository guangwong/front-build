KISSY.add(function (S, pageBuilder, buildCommon, Calendar, appHistory, AppCache) {
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