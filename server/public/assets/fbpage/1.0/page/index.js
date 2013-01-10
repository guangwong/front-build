//noinspection JSValidateTypes
KISSY.add(function (S, PageBuilder, Calendar, LocalCache, Reporter, Timestamp, Analyzer, Analytics) {
    var $ = S.all;

    function initAnalyze(config, reporter) {
        var analyzer = new Analyzer(config);
        $('#analyze-modules').on('click', function(){
            analyzer.analyze().then(function (data) {
                reporter.appendReportEl($(data.html));
            });
            analytics.track('Analyze Modules');
        });
    }

    function initBuilder(config, pageCache, reporter) {
        var pb = new PageBuilder({
            rootDir: config.rootDir
        });

        var btn =  $('#fb-build-page');
        var timestamp =  $('#fb-build-timestamp');
        var $status = $('#fb-build-status');

        timestamp.val(pageCache.get('timestamp'));

        btn.on('click', function(ev) {
            ev.preventDefault();
            $status.html('building...');
            pb.build(config.pageVersion, timestamp.val());
            analytics.track('Build One Page');
        });

        pb
            .on('build', function (ev) {
                pageCache.set('timestamp', ev.timestamp);
            })
            .on('success', function (ev) {
                $status.html('success!').show();
                setTimeout(function () {
                    $status.hide();
                }, 2000);
            })
            .on('error', function (ev) {
                if (ev.fromBuild) {
                    reporter.addError(ev.error);
                    $status.html("打包失败！ ").show();
                    return;
                }

                $status.html("error: " + ev.error.message).show();

                analytics.track('Single Page Error', {
                    message: Message
                });

            })
            .on('report', function (ev) {

                S.each(ev.reports, function (report) {
                    reporter.addReport(report);
                });

            });
        return pb;
    }

    /**
     * Page init script
     * @param config obj of config
     * @param config.rootDir App Root
     * @param config.pageVersion App Root
     */
    function init (config) {

        S.ready(function () {
            var pageCache = new LocalCache('page-cache:' + config.rootDir +  '/' +  config.pageVersion);
            var reporter = new Reporter('#reports');

            initBuilder(config, pageCache, reporter);

            initAnalyze(config, reporter);

            Calendar.init({
                triggers: 'input.timestamp-input'
            });
            Analytics.init();


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
        './mods/analyzer',
        'utils/analytics'
    ]
});
