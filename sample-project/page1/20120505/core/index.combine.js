/*
combined files : 

/Users/qipbbn/lab/front-build/sample-project/page1/page_src_temp/mods/submod1.js
/Users/qipbbn/lab/front-build/sample-project/page1/page_src_temp/mods/mod1.js
/Users/qipbbn/lab/front-build/sample-project/page1/page_src_temp/mods/mod2.js
/Users/qipbbn/lab/front-build/sample-project/page1/page_src_temp/core/index.js
*/
KISSY.add('mods/submod1',function(){
    var a = 'mods:submod1.js';
});
KISSY.add('mods/mod1',function(){
    var a = 'mods:mod1.js';
}, {
    requires: ['../mods/submod1.js']
});
KISSY.add('mods/mod2',function(){
    var a = 'mods:mod2.js';
});
KISSY.add('core/index',function(){
    var a = 'core:index.js';
}, {
    requires: ['mods/mod1','../mods/mod2']
});
