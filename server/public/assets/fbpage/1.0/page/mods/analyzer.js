/**
 * @fileOverview analyze for page
 * @author qipbbn
 */
KISSY.add(function (S, Template, tpl) {
    var $ = S.all;
    var tpl =  new Template(tpl.html);
    function analyze(pageVersion, root) {
        S.io({
            url: '/analyze-page/' + pageVersion,
            data: {
                root: root
            },
            dataType: 'json',
            success: function (data) {
                $(tpl.render(data)).appendTo($('#reports'));
            }
        });
    }

    return analyze;
}, {
    requires: ['template', '../template/page-analyze-tpl']
});