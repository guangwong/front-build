var ModuleCompiler = require('module-compiler');
var path = require('path');
ModuleCompiler.config({
    packages:[
        {
            name:'utils',
            path:'./',
            charset:'gbk'
        },
        {
            name:'page',
            path:'./page1/1.0',
            charset:'gbk'
        }
    ]
});

console.log(ModuleCompiler.analyze('./page1/1.0/page/index.js'));