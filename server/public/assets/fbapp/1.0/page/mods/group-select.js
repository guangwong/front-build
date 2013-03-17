KISSY.add(function (S) {
    var $ = S.all;
    var sel_checkbox = '.j-version-checkbox';
    S.ready(function () {
        $('body')
            .delegate('click', '.j-select-group', function (ev) {
                // 点击一个Group时候，选中相应的Version
                var $et = $(ev.target);
                ev.preventDefault();
                var versions = $et.attr('title');
                if (versions) {
                    versions = versions.split(',');
                } else {
                    versions = [];
                }

                $(sel_checkbox).each(function (el) {
                    if (S.indexOf(el.val(), versions) > -1) {
                        el.prop('checked', true);
                    } else {
                        el.prop('checked', false);
                    }
                });

                analytics.track('Select Group');
            })
            .delegate('click', '.j-version-checkbox', function (ev) {
                // 确保一次只选中一个Version
                var $et = $(ev.target);
                var val = $et.val();
                var pagename = val.split('/')[0];

                $(sel_checkbox).each(function (el) {
                    var elval = el.val();
                    if (elval !== val && el.val().split('/')[0] === pagename) {
                        el.prop('checked', false);
                    }
                });

                analytics.track('Select Version');


            })
    });
});