KISSY.add(function (S, pageBuilder, Calendar, Reporter) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        // buildPage.init();
        var reporter = new Reporter('#reports');

        pageBuilder.on('report', function (ev) {
            reporter.addReport(ev.reports);
        });

        pageBuilder.on('error', function (ev) {
            reporter.addError(ev.error);
        });

        Calendar.init({
            triggers: 'input.timestamp-input'
        });

    });
    
}, {
    requires: ['utils/build-page', 'utils/calendar-init', './mods/reporter', './mods/timestamp']
});
