KISSY.add(function(){
    return {"html":"<div class=\"csslint-list\">\n    {{#each lintReport as item}}\n        <div class='csslint-list-item'>\n            <h4 class='csslint-file'>{{item.file}}</h4>\n            <p>{{item.fullpath}}</p>\n            <pre>{{item.output}}</pre>\n        </div>\n    {{/each}}\n</div>\n<div class='plugin-build-info'>\n    用时 {{used_time}} ms\n</div>"};
});