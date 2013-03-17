/**
 * @fileOverview analyze for page
 * @author qipbbn
 */
KISSY.add(function (S, Template, tpl) {
    var $ = S.all;

    /**
     *
     * @param config
     * @param config.rootDir
     * @param config.pageVersion
     * @constructor
     */
    function Analyzer(config) {
        var self = this;
        Analyzer.superclass.constructor.apply(self, arguments);
        self.tpl =  new Template(tpl.html);
    }

    S.extend(Analyzer, S.Base, {
        /**
         * analyze a page
         * @return {Promise}
         */
        analyze: function () {
            var self = this;
            var def = new S.Defer();
            S.io({
                url: '/analyze-page/' + self.get('pageVersion'),
                data: {
                    root: self.get('rootDir')
                },
                dataType: 'json',
                success: function (data) {
                    def.resolve({
                        html: self.tpl.render(data)
                    });
                },
                error: function () {
                    def.reject('net work error');
                }
            });
            return def.promise;
        }
    });

    return Analyzer;
}, {
    requires: ['template', '../template/page-analyze-tpl']
});