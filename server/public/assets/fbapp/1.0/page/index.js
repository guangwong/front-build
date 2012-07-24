KISSY.add(function (S, buildPage, buildCommon, Calendar) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        buildPage.init();
        buildCommon.init();
        Calendar.init({
            triggers: 'input.timestamp-input'
        });
    });
    
}, {
    requires: ['utils/build-page', 'utils/build-common', 'utils/calendar-init']
});