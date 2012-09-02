KISSY.add(function (S) {

    var $ = S.all;

    S.ready(function () {
        $('body').delegate('click', '.build-timestamp', function (ev) {
            var $et = $(ev.target);
            $('.timestamp-input').val($et.html());
        })
    })
});