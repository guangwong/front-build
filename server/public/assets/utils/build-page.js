KISSY.add(function (S) {
    var $ = S.all;

    function buildPages(url, data, callback) {

        S.ajax({
            url: url,

            data: data,

            cache: false,
            dataType: 'json',
            success: function (data) {
                callback(null, data);
                
            }
        });
    }

    function PageBuilder () {
        var self = this;
        $('body').delegate('click', '.fb-build-page', function (ev) {
            ev.preventDefault();
            var $btn = $(ev.target);
            var $buildblock = $btn.parent('.buildto-block');
            var isGroupBuild = $btn.attr('data-group-build');
            var $elStatus = $buildblock.one('.status');
            var $input = $buildblock.one('input');
            $elStatus.html('building...');
            var pages = [];
            var timestamp = $input.val();

            if (isGroupBuild) {
                $('input.j-version-checkbox').each(function ($input) {
                    if ($input.prop('checked') && $input.val()) {
                        pages.push($input.val());
                    }
                });

                buildPages($btn.attr('href'),
                    {
                        timestamp: timestamp,
                        pages: pages.join(',')
                    },

                    function (err, data) {
                        if (err) {
                            return S.error(err);
                        }

                        if (data.err) {
                            var err = data.err;

                            $elStatus
                                .html('Error:' + err.message);

                            self.fire('error', {
                                error: data.err
                            });

                            return;
                        }

                        $elStatus.html('success!');

                        setTimeout(function () {
                            $elStatus.html('')
                        }, 2000);
                    });

            } else {
                buildPages($btn.attr('href'), 
                    {
                        timestamp: timestamp
                    },
                    function (err, data) {
                        if (err) {
                            return S.error(err);
                        }

                        if (data.err) {
                            var err = data.err;

                            $elStatus
                                .html('Error:' + err.message);

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
                    });
                if ($btn.attr('data-page')) {
                    pages.push($btn.attr('data-page'));
                }
            }


            
        });
    }

    S.extend(PageBuilder, S.Base);

    return new PageBuilder();
});