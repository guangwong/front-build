KISSY.add(function (S) {
    var $ = S.all;

    function PageBuilder () {
        var $buildbtn = $('.fb-build-page');
        var self = this;
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
                    console.log(data);

                    if (data.err) {
                        var err = data.err;
                        $elStatus
                            .html('Error:' + err.message);
                        console.log(data.err);
                        self.fire('error', {
                            error: data.err
                        });
                        return;
                    }

                    $elStatus.html('success!');

                    setTimeout(function () {
                        $elStatus.html('')
                    }, 2000);

                    if (data.reports) {
                        self.fire('report', {
                            reports: data.reports
                        });
                    }
                }
            });
        });
    }

    S.extend(PageBuilder, S.Base);

    return new PageBuilder();
});