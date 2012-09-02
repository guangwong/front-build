KISSY.add(function(S) {
    var $ = S.all;

    S.ready(function() {
        $('<div class="alert alert-error">强烈建议您使用Chrome， Firefox， Safari， 或者 IE9+ 打开 Kissy Pie。</div>')
            .insertBefore($('.container').children()[0]);
    });
});