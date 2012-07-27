/*
combined files : 

utils/build-page
utils/build-common
page/index

*/
KISSY.add('utils/build-page',function (S) {
    var $ = S.all;

    return {
        init: function () {
            var $buildbtn = $('.fb-build-page');
            $buildbtn.on('click', function (ev) {
                ev.preventDefault();
                var $btn = $(ev.target);
                var $elStatus = $btn.siblings('.status');
                var $input = $btn.siblings('input');
                $elStatus.html('building...');
                var timestamp = $input.val();

                S.ajax({
                    url: $btn.attr('href'),
                    data: {
                        timestamp: timestamp
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.err) {
                            var err = data.err;
                            $elStatus
                                .html('Error:' + err.message)
                            return;
                        }
                        $elStatus.html('success!');
                        setTimeout(function () {
                            $elStatus.html('')
                        }, 2000)
                    }
                });
            });
        }
    }
});KISSY.add('utils/build-common',function (S) {
    var $ = S.all;

    return {
        init: function () {
            var $elCommonBuild = $('#fb-build-common');
            var $elStatus = $elCommonBuild.siblings('.status');

            $elCommonBuild.on('click', function (ev) {
                var $et = $(ev.target);
                ev.preventDefault();
                $elStatus.html('building...');

                S.ajax({
                    url: $et.attr('href'),
                    dataType: 'json',
                    success: function (data) {
                        if (data.err) {
                            var err = data.err;
                            $elStatus
                                .html('Error:' + err.message)
                            return;
                        }
                        $elStatus.html('success!');
                        setTimeout(function () {
                            $elStatus.html('')
                        }, 2000)
                    }
                });
            });
            
        }
    };
});KISSY.add('page/index',function (S, buildPage) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        buildPage.init();
    });
    
}, {
    requires: ['utils/build-page', 'utils/build-common']
});