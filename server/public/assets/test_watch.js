// get the time between 2 events triggered by one file change;

var WatchDir = require('../../../lib/watchdir.js');
var fs = require('fs');

var ts = new Date();

fs.watch('./utils/app.less', function(ev){
    var ts2 = new Date().getTime();
    console.log('fs chagne:', ev, ts2 - ts);
    ts = ts2;
});

var w = new  WatchDir('./utils');

w.on('change', function(ev){
    console.log('------------');
    console.dir(ev);
});
