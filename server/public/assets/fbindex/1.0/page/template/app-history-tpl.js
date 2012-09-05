KISSY.add(function(){
    return {"html":"<h3>历史记录：</h3>\r\n{{#each his as item index}}\r\n<div class=\"his-item\">\r\n    <a class=\"his-title\" href=\"/app?root={{item}}\">{{item}}</a>\r\n    <a class=\"his-delete\" title=\"delete\" data-index=\"{{index}}\" href=\"#\">&times;</a>\r\n</div>\r\n{{/each}}\r\n"};
});