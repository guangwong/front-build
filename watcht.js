var fs = require('fs');
fs.watch('t', function (ev, filename){
    console.log(ev, filename);
});
fs.watch('t/file', function (ev, filename){
    console.log(ev, filename);
});
