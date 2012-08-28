KISSY.add(function (S) {
    var $ = S.all;
    S.ready(function () {
        var checkboxs = $('.j-version-checkbox');

        $('body').delegate('click', '.j-select-group', function (ev) {
            var $et = $(ev.target);
            ev.preventDefault();
            var versions = $et.attr('title');
            if (versions) {
                versions = versions.split(',');
            } else {
                versions = [];
            }

            checkboxs.each(function (el) {
                if (S.indexOf(el.val(), versions) > -1) {
                    el.prop('checked', true);
                } else {
                    el.prop('checked', false);
                }
            })
        });
    });
});