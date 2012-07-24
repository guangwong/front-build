KISSY.add(function (S, buildPage, Calendar) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        buildPage.init();
        Calendar.init({
            triggers: 'input.timestamp-input'
        });
    });
    
}, {
    requires: ['utils/build-page', 'utils/calendar-init']
});