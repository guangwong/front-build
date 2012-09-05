KISSY.add(function (S, Template, appHistory, app_history_tpl) {
    var $ = S.all;
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
                debugger;
                ev.preventDefault();
                var elItem = $(ev.target).parent('.his-item');
                var path = S.trim(elItem.one('.his-title').text());

                if (appHistory.rm(path)) {
                    $(ev.target).parent('.his-item').fadeOut(.2);
                }
            });
        });
    }
}, {
    requires: ['template', 'utils/app-history', './template/app-history-tpl']
});