KISSY.add(function (S, Calendar, Overlay) {
    var $ = S.all;
    return {
        init: function (config) {

            var popup = new Overlay.Popup({
                width:192
            });

            popup.render();

            var cal = new Calendar(popup.get('contentEl'));

            cal.on('select', function(e) {
                if (this.targetInput) {
                    $(this.targetInput).val(S.Date.format(e.date, 'yyyymmdd'));
                }
                popup.hide();
            });

            $(config.triggers)
                .on('click', function (ev) {
                    popup.show();
                    var et = $(ev.target);
                    popup.align(et, ['bl', 'tl']);
                    cal.targetInput = et;
                })
                .on('blur', function (ev) {
                    setTimeout(function () {
                        popup.hide();
                    }, 300);
                });
        }
    }
}, {
    requires: ['calendar', 'overlay', 'calendar/assets/base.css']
});