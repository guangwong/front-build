KISSY.add(function (S) {
    var $ = S.all;

    S.ready(function () {
        $('#fb-build-common').on('click', function (ev) {
            var $et = $(ev.target);
            ev.preventDefault();
            S.ajax({
                url: $et.attr('href'),
                dataType: 'json',
                success: function (data) {
                    if (data.error) {
                        alert('build Error', data.error);
                        S.error(data.error);
                        return;
                    }
                    alert('build Success');
                }
            });
        });
    });
});