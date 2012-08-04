<h4>处理文件列表:</h4>
{{#if !jobs.length}}
    <div>
        没有文件
    </div>
{{#else}}
    <ul >
        {{#each jobs as job}}
            <li>
                <h4><i class="icon-file"></i> {{job.filename}}</h4>
                <ul class="plugin-file-list">
                    {{#each job.files as file}}
                        <li>file.filename</li>
                    {{/each}}
                </ul>
            </li>
        {{/each}}
    </ul>
{{/if}}
<div class='plugin-build-info'>
    用时 {{used_time}} ms
</div>