/*
combined files : 

utils/build-page
utils/calendar-init
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
});KISSY.add('utils/calendar-init',function (S, Calendar, Overlay) {
    var $ = S.all;
    return {
        init: function (config) {

            var popup = new Overlay.Popup();
            popup.render();

            var cal = new Calendar(popup.get('contentEl')).on('select', function(e) {
                if (this.targetInput) {
                    $(this.targetInput).val(S.Date.format(e.date, 'yyyymmdd'));
                }
                popup.hide();
            });

            $(config.triggers).on('focus', function (ev) {
                popup.show();
                var et = $(ev.target);
                popup.align(et, ['bl', 'tl']);
                cal.targetInput = et;
            });
            $('body').on('mousedown', function (ev) {
                if (!popup.get('contentEl').contains(ev.target)) {
                    popup.hide();
                }
            });
        }
    }
}, {
    requires: ['calendar', 'overlay', 'calendar/assets/base.css']
});KISSY.add('page/index',function (S, buildPage, Calendar) {
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