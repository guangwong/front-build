/*
combined files : 

mods/mod1
mods/submod1
mods/mod2
core/index

*/
KISSY.add('mods/mod1',function(){
    var a = 'mods:mod1.js';
}, {
    requires: ['../mods/submod1.js']
});KISSY.add('mods/submod1',function(){
    var a = 'mods:submod1';
});KISSY.add('mods/mod2',function(){
    var a = 'mods:mod2.js';
});
KISSY.add('core/index',function(){
    var a = 'core:index.js';
}, {
    requires: ['mods/mod1','../mods/mod2']
});
