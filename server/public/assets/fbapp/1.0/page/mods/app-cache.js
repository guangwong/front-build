KISSY.add(function (S) {
    function AppCache (root) {
        if (!root || typeof root !== 'string') {
            throw new Error('NoApp');
        }
        var self = this;
        self.root = root;
        self.KEY = 'app-cache:' + self.root;
    }

    S.augment(AppCache, {
        set: function(k, v) {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            obj[k] = v;
            self.save();
        },

        save: function() {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            localStorage.setItem(KEY, JSON.stringify(obj));
        },

        get: function(k) {
            var self = this;
            var KEY = self.KEY;
            var obj = self.getAll();
            return obj[k];
        },

        getAll: function() {
            var self = this;
            var KEY = self.KEY;
            if (self._cache) {
                return self._cache;
            }
            var str = localStorage.getItem(KEY);
            if (!str) {
                self._cache = {};
            } else {
                self._cache = JSON.parse(str) || {};
            }
            return self.getAll();
        }
    });

    return AppCache;
});