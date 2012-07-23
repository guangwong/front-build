/*
combined files : 

page/index

*/
KISSY.add('page/index',function (S) {
    var $ = S.all;

    S.ready(function () {
        $('#fb-build-common').on('click', function (ev) {
            var $et = $(ev.target);
        });
    });
});