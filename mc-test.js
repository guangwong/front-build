var mc = require('module-compiler');
mc.config({
    packages: [{
        name: 'page',
        path: './page1/1.0',
        charset: 'utf8'
    }],
    silent: true
});
//var data = mc.analyze('./page1/1.0/page/index.js');


var data = mc.analyze('page/index');

console.log(data);
//console.log(mc.analyze('page/a')._moduleCache);
