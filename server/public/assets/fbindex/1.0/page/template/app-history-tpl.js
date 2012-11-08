KISSY.add(function(){
    return {"html":"<h3>历史记录：</h3>\n{{#each his as item index}}\n<div class=\"his-item\">\n    <a class=\"his-title\" href=\"/app?root={{item}}\">{{item}}\t</a>\n    <a class=\"his-delete\" title=\"delete\" data-index=\"{{index}}\" href=\"#\">&times;</a>\n</div>\n{{/each}}\n"};
});