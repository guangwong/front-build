KISSY.add(function(){
    return {"html":"<div class=\"report-plugin-item\">\r\n    <div class=\"report-plugin-item-hd{{#if content}} report-plugin-hd-has-content{{/if}}\">\r\n        <h4>{{name}}</h4>\r\n    </div>\r\n    {{#if content}}\r\n    <div class='report-plugin-item-bd'>{{content}}</div>\r\n    {{/if}}\r\n</div>"};
});