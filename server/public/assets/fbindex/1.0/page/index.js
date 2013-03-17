KISSY.add(function (S, Node, Template, appHistory, app_history_tpl, Analytics) {
    var $ = Node.all;
    if (appHistory) {
        S.ready(function () {
            var his = appHistory.get(),
                $el_his = $('#app-history');

            if (his.length) {
                $el_his.html(Template(app_history_tpl.html).render({
                    his: his
                }));
            }

            $('body').delegate('click', '.his-delete', function (ev) {
                ev.preventDefault();
                var elItem = $(ev.target).parent('.his-item');
                var path = S.trim(elItem.one('.his-title').text());

                if (appHistory.rm(path)) {
                    $(ev.target).parent('.his-item').fadeOut(.2);
                }
            });

            Analytics.init();
        });
    }
}, {
    requires: ['node', 'template', 'utils/app-history', './template/app-history-tpl', 'utils/analytics']
});