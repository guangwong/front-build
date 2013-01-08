KISSY.add(function (S) {
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
            return getList();
        },
        
        rm: function (path) {
            var list = getList();
            list = S.filter(list, function (item) {
                return item != path
            });
            saveList(list);
            return true;
        }
    }
});