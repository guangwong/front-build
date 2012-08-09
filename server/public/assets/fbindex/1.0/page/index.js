KISSY.add(function (S, Template, appHistory, app_history_tpl) {
    var $ = S.all;
    S.ready(function () {
        var his = appHistory.get();
        $('#app-history').html(Template(app_history_tpl.html).render({
            his: his
        }))
    });
}, {
    requires: ['template', 'utils/app-history', './template/app-history-tpl']
});