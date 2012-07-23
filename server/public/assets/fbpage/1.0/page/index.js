KISSY.add(function (S, buildPage) {
    var $ = S.all;

    //buildCommon
    S.ready(function () {
        buildPage.init();
    });
    
}, {
    requires: ['utils/build-page', 'utils/build-common']
});