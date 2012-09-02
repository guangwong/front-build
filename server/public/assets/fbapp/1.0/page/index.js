KISSY.add(function (S, pageBuilder, buildCommon, Calendar, appHistory) {
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