var cleanCSS = require('clean-css');
var fs = require('fs');
var cssmin = require('css-compressor').cssmin;

var testList = [
    'tbsp.source.css',
    'bootstrap.css'
]

testList.forEach(function (file) {
    fs.readFile(file, 'utf8', function (err, cnt) {
        var before = cnt.length;
        var ts0 = new Date().getTime();
        var cleancssOut = cleanCSS.process(cnt);

        var ts1 = new Date().getTime();
        var cssminOut = cssmin(cnt);
        var ts2 = new Date().getTime();
        cleanCSSLen = cleancssOut.length;
        cssminLen = cssminOut.length;
        console.log('-------------------')
        console.log('result for %s', file);
        console.log('name\t\tbefore\tafter\trate\tms')
        console.log('cleanCSS\t%s\t%s\t%s', before, cleanCSSLen, 1 - cleanCSSLen/before,  ts1-ts0);
        console.log('cleanmin\t%s\t%s\t%s', before, cssminLen, 1 - cssminLen/before, ts2-ts1);
        console.log('')

    });
});


//var minimized = cleanCSS.process(source);
