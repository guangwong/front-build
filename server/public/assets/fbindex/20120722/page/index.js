/*
combined files : 

utils/app-history
page/template/app-history-tpl
page/index

*/
KISSY.add('utils/app-history',function (S) {
    if (!window.localStorage) {
        return null;
    }

    var KEY = 'AppHistory';

    function getList() {
        var src = localStorage.getItem(KEY);

        if (!src) {
            return [];
        }
        try {
            var list = src.split(',');
        } catch (e) {
            return [];
        }

        return list;
    }

    function saveList(list) {
        return localStorage.setItem(KEY, list.join(','));
    }

    return {
        push: function (path) {
            var list = getList();

            list = S.filter(list, function (item) {
                return item != path;
            });

            list.unshift(path);
            saveList(list);
        },
        
        get: function () {
            var list = getList();
            return list;
        },
        
        rm: function (path) {
            var list = getList();
            list = S.filter(list, function (item) {
                return item != path
            });
            saveList(list);
        }
    }
});KISSY.add('page/template/app-history-tpl',function(){
    return {"html":"<h3>历史记录：</h3>\n{{#each his as item}}\n<div class='history-item'>\n    <a href=\"/app?root={{item}}\"> {{item}} </a>\n</div>\n{{/each}}\n"};
});KISSY.add('page/index',function (S, Template, appHistory, app_history_tpl) {
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