## Kissy Pie如何构建你的代码

### 应用的 Page 构建

1. 创建目录 临时 src (Page.srcDir); 临时 build (Page.destDir); timestame 目录
2. 将版本目录里面的文件，转成utf8编码， 并全部拷贝到 src 目录
3. 使用内置插件系统
    1. module-compiler: KISSY的模块打包， 从src/page/xx.js -> build/page/xx.js
    2. kissy-template: Kissy Template 模版编译，由 src/page/../xx.tpl.html 编译成 src/page/../xx.tpl.js
    2. css-combo: css打包， 从src/page/xx.css -> build/page/xx.css
    3. lesscss:  打包， 从 src/page/xx.less -> build/page/xx.less.css
    4. concat: 根据配置合并文件
    5. uglifyjs: build/page/xx.js -> build/page/xx-min.js
    6. cssmin: build/page/xx.css -> build/page/xx-min.css
4. 将build下的所有文件转码到outputCharset，并复制到timestamp目录
5. 在timestamp 目录下生成 包含打包信息的 build.json.

特点

- 发布基于时间戳目录
- page *根目录文件* 是编译入口
- 开发环境与生产环境灵活切换 (通过KISSY.Config.debug开关)

### 应用的 common 构建

1. 创建目录: 临时src (common.srcDir); 临时build (common.destDir);
2. 将common目录里面源码文件，从 inputCharset 转成utf8编码， 并全部拷贝到 临时src 目录
3. 使用内置插件系统
    1. module-compiler: KISSY的模块打包压缩， 从src/*xx.js* -> build/*xx-min.js*
    2. lesscss:  打包， 从 src/*xx.less* -> build/*xx-min.css*
    3. uglifyjs: *build*/*xx.js* -> build/*xx-min.js*
    4. cssmin: *build*/*xx.css* -> build/*xx-min.css*
4. 将临时build 目录下的 **-min.** 等压缩文件从 utf-8 转码到 outputCharset，并复制回 common目录
    
特点

- common *根目录下的文件* 为打包入口
- 可在 fb.json 里面配置文件编码