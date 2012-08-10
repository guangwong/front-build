KISSY.add(function(){
    return {"html":"<h3>历史记录：</h3>\n{{#each his as item}}\n<div class='history-item'>\n    <a href=\"/app?root={{item}}\"> {{item}} </a>\n</div>\n{{/each}}\n"};
});