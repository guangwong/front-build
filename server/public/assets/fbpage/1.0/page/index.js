KISSY.add(function (S, PageBuilder, Calendar, LocalCache, Reporter, Timestamp, Analyzer) {
    var $ = S.all;

    function initAnalyze(config, reporter) {
        var analyzer = new Analyzer(config);
        $('#analyze-modules').on('click', function(){
            analyzer.analyze().then(function (data) {
                reporter.appendReportEl($(data.html));
            });
        });
    }

    /**
     * Page init script
     * @param config obj of config
     * @param config.rootDir App Root
     * @param config.pageVersion App Root
     */
    function init (config) {

        S.ready(function () {
            var pageCache = new LocalCache('page-cache:' + config.rootDir);

            var pb = new PageBuilder({
                rootDir: config.rootDir
            });

            var btn =  $('#fb-build-page');
            var timestamp =  $('#fb-build-timestamp');
            var $status = $('#fb-build-status');
            btn.on('click', function(ev) {
                ev.preventDefault();
                $status.html('building...');
                pb.build(config.pageVersion, timestamp.val());
            });

            timestamp.val(pageCache.get('timestamp'));

            var reporter = new Reporter('#reports');

            pb.on('success', function (ev) {
                    pageCache.set('timestamp', ev.timestamp);
                    $status.html('success!').show();
                    setTimeout(function () {
                        $status.hide();
                    }, 2000);
                })
                .on('error', function (error) {
                    $status.html("error: " + error.message).show();
                })
                .on('report', function (ev) {

                    S.each(ev.reports, function (report) {
                        reporter.addReport(report);
                    });

                })
                .on('build-error', function (error) {
                    reporter.addError(error);
                });
            initAnalyze(config, reporter);

            Calendar.init({
                triggers: 'input.timestamp-input'
            });



        });
    }

    return {
        init: init
    };
}, {
    requires: [
        'utils/build-page',
        'utils/calendar-init',
        'utils/local-cache',
        './mods/reporter',
        './mods/timestamp',
        './mods/analyzer']
});
