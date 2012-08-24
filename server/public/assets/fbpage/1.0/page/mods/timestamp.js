KISSY.add(function (S) {

    var $ = S.all;

    S.ready(function () {
        $('body').delegate('click', '.build-timestamp', function (ev) {
            var $et = $(ev.target);
            var $input = $('.timestamp-input');
            var $clone = $et.clone(true);
            var offsetFrom = $et.offset();
            var offsetTo = $input.offset();
            $clone.appendTo('body');
            $clone
                .css('position', 'absolute')
                .css('left', offsetFrom.left)
                .css('top', offsetFrom.top)
                .show()
                .animate({
                    'left': offsetTo.left,
                    'top': offsetTo.top
                }, .2, 'easeNone', function () {
                    $input.val($et.html());
                    setTimeout(function () {
                        $clone.remove();
                    }, 0);
                });
        })
    })
});