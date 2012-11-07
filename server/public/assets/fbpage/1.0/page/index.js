KISSY.add(function (S, pageBuilder, Calendar, Reporter, Timestamp, Analyze) {
    var $ = S.all;

    //buildCommon
    function init (config) {
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

            Analyze(config.pageVersion, config.rootDir)

        });
    }

    return {
        init: init
    };
    
}, {
    requires: ['utils/build-page', 'utils/calendar-init', './mods/reporter', './mods/timestamp', './mods/analyze']
});
