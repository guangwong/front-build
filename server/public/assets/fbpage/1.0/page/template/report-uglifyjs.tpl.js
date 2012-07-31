KISSY.add(function(){
    return {"html":"<h4>file list</h4>\n<ul>\n    {{#each files as file}}\n        <li>\n            {{file}}\n        </li>\n    {{/each}}\n</ul>\n<div class='plugin-build-info'>\n    用时 {{used_time}} ms\n</div>"};
});