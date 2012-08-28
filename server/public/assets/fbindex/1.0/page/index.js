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
        });
    }
}, {
    requires: ['template', 'utils/app-history', './template/app-history-tpl']
});