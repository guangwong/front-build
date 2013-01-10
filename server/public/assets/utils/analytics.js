//noinspection JSValidateTypes
KISSY.add(function (S, Node) {
    var $ = Node.all;
    return {
        init: function () {
            $('body').on('click', function(ev){
                var $et = $(ev.target);
                var trackType = $et.attr('data-track');
                if (trackType) {
                    analytics.track(trackType);
                }
            });
        }
    }

}, {
    requires: ['node']
});