KISSY.add(function (S) {
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
});