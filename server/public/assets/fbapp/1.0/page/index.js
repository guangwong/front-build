KISSY.add(function (S, pageBuilder, buildCommon, Calendar) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        Calendar.init({
            triggers: 'input.timestamp-input'
        });
        buildCommon.init()
    });
    
}, {
    requires: ['utils/build-page', 'utils/build-common', 'utils/calendar-init']
});