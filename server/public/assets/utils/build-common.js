//noinspection JSValidateTypes
KISSY.add(function (S, Node) {
    var $ = Node.all;

    return {
        init: function () {
            var $elCommonBuild = $('#fb-build-common');
            var $elStatus = $elCommonBuild.siblings('.status');

            $elCommonBuild.on('click', function (ev) {
                var $et = $(ev.target);
                ev.preventDefault();
                $elStatus.html('building...');
                analytics.track('Build Common');

                S.ajax({
                    url: $et.attr('href'),
                    dataType: 'json',
                    success: function (data) {
                        if (data.err) {
                            var err = data.err;
                            $elStatus
                                .html('Error:' + err.message);
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
}, {
    requires: ['node']
});