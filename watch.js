var fs = require('fs');

fs.watch('testwatch/a.js', { persistent: true }, function (ev, filename) {
    console.log('----watch');
    console.log(ev);
    console.log(filename);
});

fs.watchFile('testwatch/a.js', function (curr, prev) {
    console.log('----watchFile');
    console.log('mtime %s %s', curr.mtime, prev.mtime);
    console.log('size %s %s', curr.size, prev.size);
});